import { define } from "@/lib/define.ts"

export default define.page(({ Component, state }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Duety</title>
      </head>

      <body>
        <header className="max-w-2xl mx-auto navbar">
          <div className="flex-1 text-xl">Duety</div>

          <div className="flex gap-2 items-center">
            <div>{state.user.username}</div>

            <div className="avatar rounded-full w-8">
              <img
                alt="Avatar"
                height={32}
                src={`http://image-proxy.trap.jp/icon/${state.user.username}?width=128`}
                width={32}
              />
            </div>
          </div>
        </header>

        <Component />
      </body>
    </html>
  )
})
