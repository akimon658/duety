import { useSignal } from "@preact/signals"
import { CircleCheck, LogIn, Unlink, X } from "lucide-preact"
import { createContext } from "preact"
import { useContext } from "preact/hooks"

interface GoogleTasksAccount {
  id: string
  username: string
}

const AccountContext = createContext<{
  account: GoogleTasksAccount | undefined
  setAccount: (account: GoogleTasksAccount | undefined) => void
}>({
  account: undefined,
  setAccount: () => {},
})

const ConnectedAccountManager = () => {
  const { setAccount } = useContext(AccountContext)
  const isDisconnecting = useSignal(false)

  const handleDisconnect = async () => {
    isDisconnecting.value = true

    try {
      const res = await fetch("/api/google-tasks/disconnect", {
        method: "DELETE",
      })

      if (res.ok) {
        setAccount(undefined)
        const dialog = document.getElementById(
          "disconnect-account-modal",
        ) as HTMLDialogElement
        dialog?.close()
      } else {
        console.error("Failed to disconnect account")
      }
    } catch (error) {
      console.error("Error disconnecting account:", error)
    } finally {
      isDisconnecting.value = false
    }
  }

  const openDisconnectModal = () => {
    const dialog = document.getElementById(
      "disconnect-account-modal",
    ) as HTMLDialogElement
    dialog?.showModal()
  }

  return (
    <>
      <div class="alert alert-soft alert-success" role="alert">
        <CircleCheck class="stroke-success" />

        <span>Googleアカウントに接続されています</span>

        <button
          class="btn btn-error btn-outline btn-sm"
          onClick={openDisconnectModal}
          type="button"
        >
          <Unlink class="size-[1.2em]" />
          接続解除
        </button>
      </div>

      <dialog id="disconnect-account-modal" class="modal">
        <div class="modal-box">
          <form method="dialog">
            <button
              class="absolute btn btn-circle btn-ghost btn-sm right-2 top-2"
              type="submit"
            >
              <X />
            </button>
          </form>

          <h3 class="font-bold text-lg">接続解除</h3>

          <p class="py-4">
            Googleアカウントの接続を解除します。よろしいですか？
          </p>

          <div class="modal-action">
            <form class="flex gap-2" method="dialog">
              <button class="btn btn-outline" type="submit">閉じる</button>

              <button
                class="btn btn-error"
                disabled={isDisconnecting.value}
                onClick={handleDisconnect}
                type="button"
              >
                {isDisconnecting.value
                  ? <span class="loading loading-spinner" />
                  : "接続解除"}
              </button>
            </form>
          </div>
        </div>

        <form class="modal-backdrop" method="dialog">
          <button type="submit">閉じる</button>
        </form>
      </dialog>
    </>
  )
}

const DisconnectedAccountManager = () => {
  const handleConnect = () => {
    window.location.href = "/api/google-tasks/auth"
  }

  return (
    <div>
      <p>Googleアカウントに接続していません。</p>

      <button class="btn btn-primary mt-2" onClick={handleConnect} type="button">
        <LogIn class="size-[1.2em]" />
        Googleアカウントで接続
      </button>
    </div>
  )
}

interface Props {
  initialAccount?: GoogleTasksAccount
}

export const AccountManager = ({ initialAccount }: Props) => {
  const account = useSignal<GoogleTasksAccount | undefined>(initialAccount)

  return (
    <AccountContext.Provider
      value={{
        account: account.value,
        setAccount: (newAccount) => {
          account.value = newAccount
        },
      }}
    >
      {account.value ? <ConnectedAccountManager /> : <DisconnectedAccountManager />}
    </AccountContext.Provider>
  )
}
