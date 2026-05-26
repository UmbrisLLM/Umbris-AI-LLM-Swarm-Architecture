"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#000000",
          color: "#DCDEE7",
          fontFamily: "Garamond, Georgia, serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <p
          style={{
            color: "#9C7BD9",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          — § THE ECLIPSE FELL · MMXXVI —
        </p>
        <h1 style={{ fontSize: 48, margin: "0 0 16px", letterSpacing: "0.05em" }}>
          The Convocation Halted
        </h1>
        <p
          style={{
            color: "#8B90A3",
            fontStyle: "italic",
            maxWidth: 440,
            marginBottom: 28,
          }}
        >
          Something deeper than a falsification refused this rendering. The
          page itself could not be cast.
        </p>
        {error.digest && (
          <p
            style={{
              color: "#4A4D5C",
              fontFamily: "ui-monospace, monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            digest · {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            color: "#9C7BD9",
            border: "1px solid rgba(156,123,217,0.6)",
            background: "transparent",
            padding: "10px 20px",
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          cast the question again
        </button>
      </body>
    </html>
  );
}
