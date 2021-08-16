import React, { Component } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import produce from "immer"

import { Star } from '../../component/icon/index'

class CryptoCoin extends Component {
    constructor(props) {
        super(props)
        this.state = {
            arr: [],
            coinData: [],
            list: [
                "dogecoin", "ethereum", "bitcoin",
                "nano", "waves", "monero", "pancakeswap",
                "stellar", "litecoin", "cardano", "tether",
                "tron", "neo", "dash", "binance-coin", "tezos",
            ],
            isLoad: false
        }
    }
    coinInitiliazer = async () => {//REST-API
        let rows = []
        let coinList = this.state.list
        var requestOptions = {
            method: 'GET',
            redirect: 'follow',
        };
        for (let i = 0; i < coinList.length; i++) {
            const element = coinList[i];
            await fetch(`https://api.coincap.io/v2/assets/${element}`, requestOptions)
                .then(response => {
                    if (response.ok)
                        return response.json()
                })
                .then(result => {
                    result === undefined && i--
                    let coin = {}
                    let data = result?.data;

                    coin.id = data.rank
                    coin.name = data.name + " - " + data.symbol;
                    coin.time = new Date().toLocaleTimeString('tr-TR', { hour12: false })
                    coin.img = `https://cryptologos.cc/logos/${coin.name.replace(/\s+/g, '').toLowerCase()}-logo.png`
                    data.priceUsd <= 1 ? coin.price = Number(data.priceUsd).toFixed(4) : coin.price = Number(data.priceUsd).toFixed(2)
                    coin.coinPercent = Number(data.changePercent24Hr).toFixed(2)

                    rows.push(coin)
                })
                .catch(err => new Error(err))
        }
        this.setState({ coinData: rows })
        this.setState({ isLoad: true })
        this.fetchData();
    }
    fetchRealTimeData = () => {//websocket

        const requestCoinName = this.state.list
        const tradeWs = new WebSocket(`wss://ws.coincap.io/prices?assets=${requestCoinName.join(',')}`)

        tradeWs.onmessage = (res) => {
            if (res !== undefined || res !== null) {
                let data = JSON.parse(res?.data)
                let row = []

                for (let i = 0; i < requestCoinName.length; i++) {
                    let uniqueCoin = {}
                    uniqueCoin.name = requestCoinName[i]?.toUpperCase()
                    uniqueCoin.id = i

                    const price = data[requestCoinName[i]]
                    uniqueCoin.price = price
                    let datetime = new Date().toLocaleTimeString('tr-TR', { hour12: false })
                    uniqueCoin.time = datetime

                    row[i] = uniqueCoin
                    var isAllDataFetchNumber = 0;
                    row.forEach(element => {
                        if (element.price !== undefined) {
                            isAllDataFetchNumber++;
                        }
                        if (isAllDataFetchNumber === row.length) {
                            this.setState(produce(state => {
                                for (let j = 0; j < row.length; j++) {
                                    try {

                                        state.coinData[j].price = row[j].price
                                        state.coinData[j].time = row[j].time

                                    } catch (error) {
                                    }

                                }
                            }))

                        }
                    });

                }
            }
            isAllDataFetchNumber = 0;
        }
    }
    fetchData = () => {
        setInterval(async () => {
            let rows = []
            let coinList = this.state.list
            const _data = this.state.coinData

            const requestOptions = {
                method: 'GET',
                redirect: 'follow'
            };

            for (let i = 0; i < coinList.length; i++) {
                const element = coinList[i];
                await fetch(`https://api.coincap.io/v2/assets/${element}`, requestOptions)
                    .then(response => {
                        if (response.ok && response.status >= 200 && response.status < 300)
                            return response.json()
                    })
                    .then(result => {
                        let data = result.data
                        let price = Number(data.priceUsd).toFixed(4)
                        let datetime = new Date().toLocaleTimeString('tr-TR', { hour12: false })
                        let coinPercent = Number(data.changePercent24Hr).toFixed(4)

                        _data.forEach((item, index) => {
                            this.setState(produce(draft => {
                                if (index == i) {
                                    draft.coinData[index].price = price
                                    draft.coinData[index].time = datetime
                                    draft.coinData[index].coinPercent = coinPercent
                                }
                            }))
                        });
                    })
                    .catch(() => i < 0 ? i = 0 : i--)
            }
        }, 5000)
    }
    componentDidMount() {
        this.coinInitiliazer();

    }
    render() {
        const { navigation } = this.props
        const { arr, coinData } = this.state

        const Item = ({ id, name, price, time, coinPercent, coinHoldingCount, coinHoldingPercent, img }) => (
            <View>
                <TouchableOpacity onPress={() => navigation.navigate('Detail',
                    {
                        id,
                        name,
                        price,
                        time,
                        coinPercent,
                        coinHoldingCount,
                        coinHoldingPercent,
                    },
                )} >
                    <View style={styles.coinRow}>
                        <View>
                            <Image style={{ width: 30, height: 30, right: 10 }} source={{ uri: img }} />
                        </View>
                        <View style={{ width: '15%' }}>
                            <Text style={styles.coinHeader}>{name}</Text>
                            <Text style={styles.coinTime}>{time}</Text>
                        </View>
                        <View style={{ width: 100 }}>

                        </View>
                        {
                            coinPercent < 0 ?
                                (<View style={styles.coinPriceBaloonRed}>
                                    <Text style={styles.coinPriceWhite}>{price} $</Text>
                                    <Text style={styles.coinPercent}>{coinPercent} % ▼</Text>
                                </View>)
                                :
                                (<View style={styles.coinPriceBaloon}>
                                    <Text style={styles.coinPrice}>{price} $</Text>
                                    <Text style={styles.coinPercent}>{coinPercent} % ▲</Text>
                                </View>)
                        }
                        <TouchableOpacity style={{ width: 25, alignItems: 'center' }}
                            onPress={() => {
                                let item = {
                                    id: id,
                                    name: name,
                                    price: price,
                                    time: time,
                                    coinPercent: coinPercent,
                                    marketcoin: false,
                                }
                                if (item !== null) {
                                    AsyncStorage.setItem(item.id + "", JSON.stringify(item)).catch((err) => console.log(err))
                                }
                                else {
                                    console.log("hata");
                                }
                            }
                            }>
                            <Star color="#ff9c00" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
                <View style={styles.hr}></View>
            </View >
        );
        const renderItem = ({ item }) => (
            <Item
                id={item.id}
                name={item.name}
                price={item.price}
                time={item.time}
                coinPercent={item.coinPercent}
                coinHoldingCount={item.coinHoldingCount}
                coinHoldingPercent={item.coinHoldingPercent}
                img={item.img}
            />
        );
        return (
            <View>
                {
                    this.state.isLoad == true ? (
                        <FlatList
                            data={coinData}
                            renderItem={renderItem}
                            keyExtractor={Item => Item.id}
                        />
                    ) : (
                        <View style={{ width: '100%', height: 100, paddingHorizontal: 20, position: 'absolute' }}>
                            <View style={{ width: '20%', backgroundColor: '#a0a0a0', height: '60%', borderRadius: 100, justifyContent: 'center' }}><ActivityIndicator size="large" color="pink" /></View>
                            <View style={{ width: '40%', backgroundColor: '#a0a0a0', height: '10%', left: '30%', bottom: '50%', borderRadius: 10 }}></View>
                            <View style={{ width: '60%', backgroundColor: '#a0a0a0', height: '10%', left: '30%', bottom: '40%', borderRadius: 10 }}></View>
                        </View>
                    )
                }
            </View>
        )
    }
}

const styles = StyleSheet.create({
    coinRow: {
        backgroundColor: '#fff',
        width: '100%',
        height: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20

    },
    coinHeader: {
        width: 150,
        height: 37,
        marginTop: 22,
        fontSize: 16,
        color: '#000',
        fontFamily: 'Raleway'
    },
    coinTime: {
        fontWeight: '400',
        color: '#000',
        width: 100,
    },
    coinPrice: {
        fontSize: 14,
        marginTop: 3,
        fontFamily: 'Raleway'

    },
    coinPriceWhite: {
        fontSize: 14,
        marginTop: 3,
        fontFamily: 'Raleway',
        color: '#fff'

    },
    coinPercent: {
        fontSize: 14,
        width: 100,
        marginTop: 10,
        left: 10

    },

    coinPriceBaloon: {
        width: 110,
        height: 26,
        top: 0,
        borderRadius: 50,
        backgroundColor: '#2BFEBA',
        alignItems: 'center',
    },
    coinPriceBaloonRed: {
        width: 110,
        height: 26,
        top: 0,
        borderRadius: 50,
        backgroundColor: '#ff4d4d',
        alignItems: 'center',
    },
    hr: {
        width: '80%',
        height: 1,
        backgroundColor: '#e0e0e0',
        marginLeft: '10%'

    }
})

export default CryptoCoin