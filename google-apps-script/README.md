# Google Apps Script セットアップ手順

このディレクトリには、VSCode Daily Report Extension用のGoogle Apps Scriptファイルが含まれています。

## セットアップ手順

### 1. Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com/)にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「Daily Report Calendar Export」に変更

### 2. コードの追加

1. デフォルトの`Code.gs`ファイルの内容を、このディレクトリの`Code.gs`の内容で置き換え
2. `appsscript.json`の内容も同様に置き換え

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

このURLをコピーして、VSCode ExtensionのGAS設定で使用します。

## 使用方法

### VSCode Extension側での設定

1. VSCodeでコマンドパレット（Ctrl+Shift+P）を開く
2. 「Daily Report: Configure Google Apps Script URL」を実行
3. 取得したWeb App URLを入力

### カレンダーイベントのインポート

1. 日報ファイルを開く
2. `Ctrl+Shift+G` を押す
3. 「Authenticate」ボタンをクリック
4. ブラウザでGoogle認証を完了
5. 表示されたJSONレスポンスをコピー
6. VSCodeの入力ボックスにペースト
7. カレンダーイベントが日報に追加される

## API仕様

### エンドポイント
```
GET https://script.google.com/macros/s/{SCRIPT_ID}/exec?date=YYYY-MM-DD
```

### パラメータ
- `date` (オプション): 取得する日付（YYYY-MM-DD形式）。省略時は当日

### レスポンス例
```json
{
  "success": true,
  "date": "2024-01-15",
  "events": [
    {
      "title": "定例ミーティング",
      "startTime": "2024-01-15T09:00:00.000Z",
      "endTime": "2024-01-15T10:00:00.000Z",
      "location": "会議室A",
      "attendees": 5,
      "isAllDay": false,
      "description": "週次の進捗確認"
    }
  ],
  "timestamp": "2024-01-15T08:30:00.000Z",
  "eventCount": 1
}
```

## トラブルシューティング

### よくある問題

1. **権限エラー**
   - カレンダーへのアクセス権限が不足している場合があります
   - プロジェクトの権限設定を確認してください

2. **認証エラー**
   - Web Appのアクセス権限が正しく設定されているか確認
   - 「自分のみ」に設定した場合、認証が必要になります

3. **イベントが取得できない**
   - Googleカレンダーにイベントが存在するか確認
   - 日付形式が正しいか確認（YYYY-MM-DD）

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

実行ログで詳細なエラー情報を確認できます。

## セキュリティ注意事項

- このWeb Appは「自分のみ」アクセス可能に設定されています
- カレンダーの読み取り専用アクセスのみが許可されています
- 自分のGoogleアカウントでのみアクセス可能なため、セキュアです

## 更新手順

コードを更新した場合:

1. Google Apps Scriptエディタでコードを更新
2. 「デプロイ」→「デプロイを管理」
3. 編集アイコンをクリック
4. 新しいバージョンを作成してデプロイ