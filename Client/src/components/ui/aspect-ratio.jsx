const AspectRatio = ({ ratio = 1, children, style, ...props }) => (
  <div
    style={{ position: "relative", width: "100%", paddingBottom: `${(1 / ratio) * 100}%`, ...style }}
    {...props}
  >
    <div style={{ position: "absolute", inset: 0 }}>{children}</div>
  </div>
);

export { AspectRatio };
