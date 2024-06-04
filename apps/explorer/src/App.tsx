import * as anchor from "@coral-xyz/anchor"
import { EnterIcon, ExitIcon, HamburgerMenuIcon, PlusIcon, TimerIcon } from "@radix-ui/react-icons"
import * as Toast from "@radix-ui/react-toast"
import { Box, Button, Callout, Container, Flex, Link } from "@radix-ui/themes"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useTransactionError } from "gamba-react-v2"
import React from "react"
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import styled from "styled-components"

import { useMediaQuery, useToast, useToastStore } from "@/hooks"
import CreatePoolView from "@/views/CreatePool/CreatePoolView"
import DebugUserView from "@/views/Debug/DebugUser"
import DebugView from "@/views/Debug/DebugView"

import Dashboard from "@/views/Dashboard/Dashboard"
import AllUsers from "@/views/Debug/AllUsers"
import DaoView from "@/views/Debug/DaoView"
import { PlatformView } from "@/views/Platform/PlatformView"
import { PlayerView } from "@/views/Player/PlayerView"
import PoolConfigureView from "@/views/Pool/PoolConfigView"
import PoolDepositView from "@/views/Pool/PoolDeposit"
import PoolView from "@/views/Pool/PoolView"
import PortfolioView from "@/views/Portfolio/PortfolioView"
import TransactionView from "@/views/Transaction/Transaction"
import { Sidebar } from "./Sidebar"
import { StatusResponse, useApi } from "./api"
import NavigationMenu from "./components/NavigationMenu"
import { PoolList } from "./views/Dashboard/PoolList"
import { TopPlatforms } from "./views/Dashboard/TopPlatforms"
import { PlayersView } from "./views/PlayersView"
import EmbeddedTransactionView from "./views/Transaction/EmbeddedTransaction"

const Header = styled(Box)`
  background-color: var(--color-panel);
`

const Logo = styled(NavLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  color: white;
  gap: 10px;
  & > img {
    height: 35px;
  }
`

export function App() {
  const navigate = useNavigate()
  const toasts = useToastStore(state => state.toasts)
  const toast = useToast()
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const { data: status = {syncing: false} } = useApi<StatusResponse>("/status")
  const [sidebar, setSidebar] = React.useState(false)
  const md = useMediaQuery("md")

  useTransactionError(err => {
    toast({
      title: "❌ Transaction Error",
      description: (() => {
        if (err instanceof anchor.AnchorError) {
          return err.error.errorMessage
        }
        return (err as any).message
      })(),
    })
  })

  const embedded = new URLSearchParams(useLocation().search).has('embed')

  return (
    <>
    <Sidebar open={sidebar} onClose={() => setSidebar(false)} />
      {!embedded && (
        <Header p="2" px="4">
          <Container>
            <Flex gap="2" align="center" justify="between">
              <Flex gap="4" align="center">
                <Logo to="/">
                  <img alt="Logo" src="/logo.svg" />
                </Logo>
              </Flex>
              {!md && (
                <Button variant="surface" onClick={() => setSidebar(!sidebar)}>
                  <HamburgerMenuIcon />
                </Button>
              )}
              {md && (
                <>
                  <NavigationMenu />
                  <Flex gap="2" align="center" style={{ position: "relative" }}>
                    <Button size="3" variant="soft" color="green" onClick={() => navigate("/create")}>
                      Create Pool <PlusIcon />
                    </Button>
                    {!wallet.connected ? (
                      <Button disabled={wallet.connecting} onClick={() => walletModal.setVisible(true)} size="3" variant="soft">
                        Connect <EnterIcon />
                      </Button>
                    ) : (
                      <Button color="gray" onClick={() => wallet.disconnect()} size="3" variant="soft">
                        {wallet.publicKey?.toBase58().substring(0, 6)}...
                        <ExitIcon />
                      </Button>
                    )}
                  </Flex>
                </>
              )}
            </Flex>
          </Container>
        </Header>
      )}

      <Container p="4">
        <Toast.Viewport className="ToastViewport" />

        {toasts.map((toast, index) => (
          <Toast.Root className="ToastRoot" key={index}>
            <Toast.Title className="ToastTitle">
              {toast.title}
            </Toast.Title>
            <Toast.Description asChild>
              <div className="ToastDescription">
                {toast.description}
                <br />
                {toast.link && (
                  <Link href={toast.link} target="_blank">Link</Link>
                )}
              </div>
            </Toast.Description>
            <Toast.Action className="ToastAction" asChild altText="Goto schedule to undo">
              <Button variant="soft" size="1">
                Ok
              </Button>
            </Toast.Action>
          </Toast.Root>
        ))}

        {status.syncing && (
          <Callout.Root color="orange" mb="4">
            <Callout.Icon>
              <TimerIcon />
            </Callout.Icon>
            <Callout.Text>
              Sync in progress. Displayed data is incomplete until it finishes.
            </Callout.Text>
          </Callout.Root>
        )}

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/debug" element={<DebugView />} />
          <Route path="/pools" element={<PoolList />} />
          <Route path="/leaderboard" element={<PlayersView />} />
          <Route path="/platforms" element={<TopPlatforms days={36500} limit={1000} />} />
          <Route path="/dao" element={<DaoView />} />
          <Route path="/platform/:address" element={<PlatformView />} />
          <Route path="/player/:address" element={<PlayerView />} />
          <Route path="/users" element={<AllUsers />} />
          <Route path="/portfolio" element={<PortfolioView />} />
          <Route path="/user" element={<DebugUserView />} />
          <Route path="/tx/:txid" element={<TransactionView />} />
          <Route path="/embed/tx/:txid" element={<EmbeddedTransactionView />} />
          <Route path="/create" element={<CreatePoolView />} />
          <Route path="/pool/:poolId" element={<PoolView />} />
          <Route path="/pool/:poolId/deposit" element={<PoolDepositView />} />
          <Route path="/pool/:poolId/configure" element={<PoolConfigureView />} />
        </Routes>
      </Container>
    </>
  )
}
