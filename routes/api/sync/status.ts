import { define } from "../../../lib/define.ts"
import { pollingService } from "../../../services/pollingService.ts"

export const handler = define.handlers({
  GET: (_ctx) => {
    const config = pollingService.getConfig()
    const isActive = pollingService.isActive()

    return Response.json({
      pollingEnabled: config.enabled,
      pollingActive: isActive,
      intervalMinutes: config.intervalMinutes,
    })
  },
})
