import { useSignal } from "@preact/signals"
import { RefreshCw } from "lucide-preact"

interface SyncStats {
  created: number
  updated: number
  deleted: number
  errors: number
  errorMessages: string[]
}

interface SyncResult {
  success: boolean
  stats: SyncStats
  error?: string
}

interface Props {
  hasCalendar: boolean
  hasAccount: boolean
}

export const SyncManager = ({ hasCalendar, hasAccount }: Props) => {
  const isSyncing = useSignal(false)
  const lastSyncResult = useSignal<SyncResult | null>(null)

  const handleSync = async () => {
    isSyncing.value = true
    lastSyncResult.value = null

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
      })

      const result = await response.json()
      lastSyncResult.value = result

      if (!result.success) {
        console.error("Sync failed:", result)
      }
    } catch (error) {
      console.error("Sync request error:", error)
      lastSyncResult.value = {
        success: false,
        stats: { created: 0, updated: 0, deleted: 0, errors: 1, errorMessages: [] },
        error: error instanceof Error ? error.message : "Unknown error",
      }
    } finally {
      isSyncing.value = false
    }
  }

  const canSync = hasCalendar && hasAccount

  return (
    <div class="space-y-4">
      <div>
        <p class="mb-2">
          カレンダーから課題を取得し、Google Tasksに同期します。
        </p>

        <button
          class="btn btn-primary"
          disabled={!canSync || isSyncing.value}
          onClick={handleSync}
          type="button"
        >
          {isSyncing.value ? (
            <>
              <span class="loading loading-spinner" />
              同期中...
            </>
          ) : (
            <>
              <RefreshCw class="size-[1.2em]" />
              同期を実行
            </>
          )}
        </button>

        {!canSync && (
          <p class="mt-2 text-sm text-error">
            同期を実行するには、カレンダーとGoogleアカウントの両方を登録してください。
          </p>
        )}
      </div>

      {lastSyncResult.value && (
        <div
          class={`alert ${lastSyncResult.value.success ? "alert-success" : "alert-error"}`}
          role="alert"
        >
          <div class="flex-col items-start gap-2">
            <div class="font-bold">
              {lastSyncResult.value.success
                ? "同期が完了しました"
                : "同期中にエラーが発生しました"}
            </div>

            <div class="text-sm">
              <ul class="list-disc list-inside">
                <li>作成: {lastSyncResult.value.stats.created}件</li>
                <li>更新: {lastSyncResult.value.stats.updated}件</li>
                <li>削除: {lastSyncResult.value.stats.deleted}件</li>
                {lastSyncResult.value.stats.errors > 0 && (
                  <li class="text-error">
                    エラー: {lastSyncResult.value.stats.errors}件
                  </li>
                )}
              </ul>

              {lastSyncResult.value.stats.errorMessages.length > 0 && (
                <div class="mt-2">
                  <p class="font-semibold">エラーメッセージ:</p>
                  <ul class="list-disc list-inside">
                    {lastSyncResult.value.stats.errorMessages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {lastSyncResult.value.error && (
                <p class="mt-2 text-error">{lastSyncResult.value.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
