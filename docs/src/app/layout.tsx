import "./globals.css";

export const metadata = {
  title: "SunSet",
  description: "감정·시각·청각 기반 일기 허브",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
