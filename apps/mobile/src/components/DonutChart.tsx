import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  segments,
  size = 140,
  strokeWidth = 20,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulativeOffset = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0 &&
          segments.map((segment, i) => {
            const fraction = segment.value / total;
            const segmentLength = fraction * circumference;
            const dashOffset = circumference - cumulativeOffset;
            cumulativeOffset += segmentLength;

            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                fill="none"
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            );
          })}
      </Svg>
    </View>
  );
}
