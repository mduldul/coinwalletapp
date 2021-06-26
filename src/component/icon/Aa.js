import * as React from 'react';
import Svg, {Image} from 'react-native-svg';

function SvgAa(props) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width={164}
      height={48}
      viewBox="0 0 164 48"
      className=""
      {...props}>
      <Image
        width={164}
        height={48}
        xlinkHref="data:image/png;base64,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"
      />
    </Svg>
  );
}

export default SvgAa;
