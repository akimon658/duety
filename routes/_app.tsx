import { define } from "@/lib/define.ts"

export default define.page(({ Component }) => {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Duety</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  )
})
