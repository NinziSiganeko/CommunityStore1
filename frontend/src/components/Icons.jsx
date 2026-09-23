function ShieldIcon({ color }) {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill={color}>
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>;
}

function StarIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>;
}

function Badge({ type }) {
  if (!type) return null;
  const colors = { verified: "#15803D", faculty: "#1D4ED8", graduate: "#7C3AED" };
  const labels = { verified: "VERIFIED", faculty: "FACULTY", graduate: "GRADUATE" };
  return <span className={`badge ${type}`}><ShieldIcon color={colors[type]} />{labels[type]}</span>;
}

function Rating({ value }) {
  if (!value) return null;
  return <span className="rating"><StarIcon /> {value}</span>;
}

export { Badge, Rating, ShieldIcon };
