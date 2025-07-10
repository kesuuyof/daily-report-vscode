# Daily Report VSCode Extension

VSCodeで日報作成・管理を効率化する拡張機能です。Googleカレンダー連携により、ミーティング予定を自動で日報に追加できます。

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

### 3. カレンダー連携 (`Ctrl+Shift+G`)
- Googleカレンダーから当日のミーティング予定を取得
- 日報に「本日のMTG予定」セクションとして自動追加
- 時間、場所、参加者数を含む詳細情報を表示
- Google Apps Script経由でセキュアにアクセス

## インストール方法

1. このリポジトリをクローン
2. 依存関係をインストール: `npm install`
3. コンパイル: `npm run compile`
4. VSCodeで拡張機能をローカルインストール

## Google Apps Script セットアップ（カレンダー連携用）

カレンダー連携機能を使用するには、Google Apps Scriptの設定が必要です。

### 1. Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com/)にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「Daily Report Calendar Export」に変更

### 2. コードの追加

1. デフォルトの`Code.gs`ファイルの内容を、`google-apps-script/Code.gs`の内容で置き換え
2. `appsscript.json`の内容も`google-apps-script/appsscript.json`で置き換え

### 3. Web Appとしてデプロイ

1. 右上の「デプロイ」ボタンをクリック
2. 「新しいデプロイ」を選択
3. 設定:
   - **種類**: ウェブアプリ
   - **説明**: Daily Report Calendar API
   - **実行者**: 自分
   - **アクセス権限**: 自分のみ
4. 「デプロイ」をクリック
5. 初回デプロイ時は権限の承認が必要:
   - 「承認」をクリック
   - Googleアカウントを選択
   - 「Advanced」→「Go to Daily Report Calendar Export (unsafe)」をクリック
   - 「Allow」をクリック

### 4. Web App URLの取得

デプロイ完了後、Web App URLが表示されます:
```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

このURLをコピーして、VSCode拡張機能で設定します。

## 設定

### VSCode設定（推奨）
VSCodeの設定画面で `Daily Report: Reports Directory` を設定:
- `~/DailyReports` (デフォルト) - ホームディレクトリ下のDailyReportsフォルダ
- `/absolute/path/to/reports` - 絶対パス
- `Documents/Reports` - ホームディレクトリからの相対パス

### Google Apps Script URL設定

カレンダー連携を使用するには、GAS Web App URLの設定が必要です：

1. VSCodeでコマンドパレット（`Ctrl+Shift+P`）を開く
2. 「Daily Report: Configure Google Apps Script URL」を実行
3. 取得したWeb App URLを入力

### config.json（オプション）
`config/config.json`ファイルでテンプレートなどをカスタマイズ：

```json
{
  "reportsDirectory": "~/DailyReports",
  "fileNameFormat": "YYYY-MM-DD",
  "timeFormat": "24h",
  "googleAppsScript": {
    "webAppUrl": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
    "timeout": 10000
  },
  "calendar": {
    "timeZone": "Asia/Tokyo",
    "includeAllDayEvents": true,
    "includeLocation": true,
    "includeAttendeeCount": true
  },
  "template": {
    "header": "# Daily Report - {{date}}",
    "sections": [
      "## 本日のMTG予定",
      "## 本日の作業・メモ",
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
4. `Ctrl+Shift+G` でカレンダーイベントをインポート

### カレンダー連携の使用手順

1. 日報ファイルを開く（または新規作成）
2. `Ctrl+Shift+G` を押す
3. 「Open Browser」ボタンをクリック
4. ブラウザでGoogle認証を完了
5. 表示されたJSONレスポンスをコピー
6. VSCodeの入力ボックスにペースト
7. カレンダーイベントが日報に追加される

### コマンドパレット (`Ctrl+Shift+P`)
- `Daily Report: Create Daily Report` - 日報ファイルを作成
- `Daily Report: Add Report Entry` - エントリを追加
- `Daily Report: Import Today's Calendar Events` - カレンダーイベントをインポート
- `Daily Report: Configure Google Apps Script URL` - GAS URLを設定

## トラブルシューティング

### カレンダー連携でよくある問題

1. **認証エラー**
   - Web Appのアクセス権限が正しく設定されているか確認
   - 「自分のみ」に設定した場合、認証が必要になります

2. **イベントが取得できない**
   - Googleカレンダーにイベントが存在するか確認
   - 日付形式が正しいか確認（YYYY-MM-DD）

3. **入力ボックスが表示されない**
   - VSCodeを再起動してみてください
   - コマンドパレットから手動で実行してみてください

### デバッグ方法

Google Apps Scriptエディタでテスト関数を実行:

```javascript
// 今日のイベントをテスト
testGetEvents()

// 特定の日付のイベントをテスト
testGetEventsForDate()

// doGet関数をテスト
testDoGet()
```

日報ファイルは設定されたディレクトリに保存されます。