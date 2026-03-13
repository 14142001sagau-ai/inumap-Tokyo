export const metadata = {
  title: 'INUMAP TOKYO — 江戸川区 犬連れ引越しスコアマップ',
  description: '江戸川区の丁目レベルで犬連れ生活のしやすさをスコア化。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{margin:0,padding:0,fontFamily:"'Hiragino Sans','Noto Sans JP',sans-serif"}}>
        {children}
      </body>
    </html>
  );
}
