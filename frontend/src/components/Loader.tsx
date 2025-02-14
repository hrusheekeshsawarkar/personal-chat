export default function Loader() {
  return (
    <div className="loading">
      <svg width="32px" height="24px" viewBox="0 0 64 48" style={{ transform: 'scale(0.5)' }}>
        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
      </svg>
    </div>
  );
} 