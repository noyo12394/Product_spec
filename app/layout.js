import "./globals.css";

export const metadata = {
  title: "EstimAI — AI-Powered Construction Estimation",
  description:
    "Upload your drawing set, let AI do the takeoff, and ship a defensible, priced estimate in hours — with an estimator in control the whole way.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
