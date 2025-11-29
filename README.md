# Duety

大学のLMS（Moodle）から取得した課題の期限のiCalファイルから、自動でGoogle
Tasksにタスクを追加するアプリケーション。

## 技術スタック

- **Runtime**: Deno
- **Framework**: Fresh 2
- **ORM**: Drizzle ORM
- **Database**: MariaDB
- **Frontend**: Preact + Tailwind CSS + daisyUI

## セットアップ

### 前提条件

- Deno 2.0以上
- Docker & Docker Compose（ローカル開発用）

### Docker Composeでのローカル開発（推奨）

1. リポジトリをクローン

```bash
git clone https://github.com/akimon658/duety.git
cd duety
```

2. 環境変数を設定

```bash
cp .env.example .env
```

3. Docker Composeでサービスを起動

```bash
docker compose up -d
```

これにより以下のサービスが起動します：

- **MariaDB**: `localhost:3306` - データベース
- **Caddy**: `localhost:8080` -
  リバースプロキシ（`X-Forwarded-User`ヘッダー付加）

4. データベーススキーマをプッシュ

```bash
deno task db:push
```

5. 開発サーバーを起動

```bash
deno task dev
```

6. ブラウザで `http://localhost:8080` にアクセス

> **Note**:
> Caddyを経由することで`X-Forwarded-User`ヘッダーが自動的に付加されます。
> テストユーザー名を変更するには`Caddyfile`を編集してください。

### 手動セットアップ

MariaDBを別途インストールしている場合は、以下の手順でセットアップできます：

1. 環境変数を設定

```bash
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定
```

2. データベースを作成

```bash
mysql -u root -p -e "CREATE DATABASE duety;"
```

3. スキーマをプッシュ

```bash
deno task db:push
```

4. 開発サーバーを起動

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
├── db/            # データベーススキーマと接続
├── islands/       # クライアントサイドインタラクティブコンポーネント
├── lib/           # ユーティリティとサービス
├── static/        # 静的ファイル
├── compose.yaml   # Docker Compose設定
├── Caddyfile      # Caddy設定（X-Forwarded-Userヘッダー付加）
└── main.tsx       # アプリケーションエントリーポイント
```

## 認証

このアプリケーションはプロキシサーバーでの認証を前提としています。
`X-Forwarded-User`ヘッダーからユーザー名を取得し、存在しないユーザーは自動的に作成されます。

ローカル開発ではCaddyが`X-Forwarded-User`ヘッダーを付加します。
`Caddyfile`の`request_header X-Forwarded-User "testuser"`行を編集することでテストユーザーを変更できます。

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
