# Daily Report VSCode Extension

VSCodeで日報作成・管理を効率化する拡張機能です。

## 機能

### 1. 日報ファイル作成 (`Ctrl+Shift+D`)
- 指定フォルダに日付プレフィックス付きMarkdownファイルを作成
- ファイル名形式: `YYYY-MM-DD.md`
- テンプレートを使用して構造化された日報を生成

### 2. エントリ追記 (`Ctrl+Shift+S`)
- 入力ポップアップを表示
- 今日の日報ファイルに時間付きでリスト形式で追記
- 時間フォーマット: 24時間表示 (`14:30`)
- 追記形式: `- 14:30 [入力内容]`

## インストール方法

1. このリポジトリをクローン
2. 依存関係をインストール: `npm install`
3. コンパイル: `npm run compile`
4. VSCodeで拡張機能をローカルインストール

## 設定

### VSCode設定（推奨）
VSCodeの設定画面で `Daily Report: Reports Directory` を設定:
- `~/DailyReports` (デフォルト) - ホームディレクトリ下のDailyReportsフォルダ
- `/absolute/path/to/reports` - 絶対パス
- `Documents/Reports` - ホームディレクトリからの相対パス

### config.json（オプション）
`config/config.json`ファイルでテンプレートなどをカスタマイズ：

```json
{
  "reportsDirectory": "~/DailyReports",
  "fileNameFormat": "YYYY-MM-DD",
  "timeFormat": "24h",
  "template": {
    "header": "# Daily Report - {{date}}",
    "sections": [
      "## 本日の作業",
      "## 課題・所感",
      "## 明日の予定"
    ]
  }
}
```

## パッケージング

VSIXファイルを生成するには：

```bash
npm install -g vsce
vsce package
```

## 使用方法

### キーバインド
1. VSCodeでワークスペースを開く
2. `Ctrl+Shift+D` で日報ファイルを作成
3. `Ctrl+Shift+S` でエントリを追加

### コマンドパレット (`Cmd+P` または `Ctrl+Shift+P`)
1. `Daily Report: Create Daily Report` - 日報ファイルを作成
2. `Daily Report: Add Report Entry` - エントリを追加

日報ファイルは `reports/` ディレクトリに保存されます。