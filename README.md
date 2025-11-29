# Duety

大学のLMS（Moodle）から取得した課題の期限のiCalファイルから、自動でGoogle
Tasksにタスクを追加するアプリケーション。

## 技術スタック

- **Runtime**: Deno
- **Framework**: Fresh
- **ORM**: Drizzle ORM
- **Database**: MariaDB
- **Frontend**: Preact + Tailwind CSS

## セットアップ

### 前提条件

- Deno 1.40以上
- MariaDB 10.6以上

### インストール

1. リポジトリをクローン

```bash
git clone https://github.com/akimon658/duety.git
cd duety
```

2. 環境変数を設定

```bash
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定
```

3. データベースを作成

```bash
mysql -u root -p -e "CREATE DATABASE duety;"
```

4. スキーマをプッシュ

```bash
deno task db:push
```

### 開発サーバーの起動

```bash
deno task dev
```

### 本番ビルド

```bash
deno task build
deno task start
```

## プロジェクト構造

```
duety/
├── components/     # 共有コンポーネント
├── db/            # データベーススキーマと接続
├── islands/       # クライアントサイドインタラクティブコンポーネント
├── lib/           # ユーティリティとサービス
├── routes/        # ページとAPIルート
│   └── api/       # APIエンドポイント
└── static/        # 静的ファイル
```

## 認証

このアプリケーションはプロキシサーバーでの認証を前提としています。
`X-Forwarded-User`ヘッダーからユーザー名を取得し、存在しないユーザーは自動的に作成されます。

## API

### カレンダー

- `GET /api/calendars` - ユーザーのカレンダー一覧を取得
- `POST /api/calendars` - 新しいカレンダーを登録
- `GET /api/calendars/:id` - 特定のカレンダーを取得
- `DELETE /api/calendars/:id` - カレンダーを削除

## 拡張性

タスクサービスは`lib/task-service.ts`のインターフェースを実装することで追加できます。
現在はGoogle Tasksをサポートしており、将来的にはTodoist、Microsoft To
Do等への対応も可能な設計になっています。

## ライセンス

Apache License 2.0
