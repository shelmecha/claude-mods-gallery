// A Client module: it draws a counter that ticks twice a second, with no hooks module involved
let ticks = 0
export default function Ticker(props, s) {
  const { Box, Text } = s.elements
  if (s.state === undefined) {
    // First call only: start the timer, then store the first value
    s.every(500, () => { ticks += 1; s.setState(ticks) })
    s.setState(0)
  }
  return Box({
    borderStyle: 'round',
    paddingX: 1,
    children: [Text({ color: 'fastMode', children: [props.label + ': ' + (s.state ?? 0)] })],
  })
}
