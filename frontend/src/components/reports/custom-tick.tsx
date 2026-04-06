export function CustomTick({
  x,
  y,
  payload,
}: {
  x: string | number;
  y: string | number;
  payload: { value: string };
}) {
  const [line1, line2] = payload.value.split('\n');

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} textAnchor="middle" fill="var(--text-muted)" fontSize={12}>
        <tspan x={0} dy="0.8em">
          {line1}
        </tspan>
        {line2 && (
          <tspan x={0} dy="1.2em">
            {line2}
          </tspan>
        )}
      </text>
    </g>
  );
}
