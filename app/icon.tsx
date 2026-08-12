import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0b1210",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e4b86a",
          fontSize: 22,
        }}
      >
        G
      </div>
    ),
    size,
  );
}
