const dividerStyle = {
  background: "linear-gradient(180deg, #0E2A66 0%, #2155C4 100%)",
  boxShadow: "0 0 18px rgba(33, 85, 196, 0.28)",
};

const AuthPanelDivider = () => {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden -translate-x-1/2 lg:flex lg:items-center">
      <div
        className="h-[72%] w-[3px] rounded-full opacity-80"
        style={dividerStyle}
        aria-hidden="true"
      />
    </div>
  );
};

export default AuthPanelDivider;
