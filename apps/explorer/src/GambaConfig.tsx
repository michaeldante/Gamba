import * as anchor from "@coral-xyz/anchor"
import { Button, Flex, Grid, Heading, Text, TextField } from "@radix-ui/themes"
import { Keypair, PublicKey } from "@solana/web3.js"
import { basisPoints, decodeGambaState, getGambaStateAddress } from "gamba-core-v2"
import { useAccount, useGambaProgram, useSendTransaction } from "gamba-react-v2"
import React from "react"
import { DetailCard } from "./components"

interface GambaStateInput {
  rngAddress: string;
  gambaFee: string;
  maxCreatorFee: string;
  poolCreationFee: string;
  antiSpamFee: string;
  maxHouseEdge: string;
  defaultPoolFee: string;
  jackpotPayoutToUserBps: string;
  jackpotPayoutToCreatorBps: String;
  jackpotPayoutToPoolBps: String;
  jackpotPayoutToGambaBps: String;
  bonusToJackpotRatioBps: string;
  maxPayoutBps: string;
  poolWithdrawFeeBps: string;
  poolCreationAllowed: boolean;
  poolDepositAllowed: boolean;
  poolWithdrawAllowed: boolean;
  playingAllowed: boolean;
  distributionRecipient: string;
}

export function ConfigDialog() {
  const sendTx = useSendTransaction()
  const program = useGambaProgram()
  const gambaState = useAccount(getGambaStateAddress(), decodeGambaState)
  const [_input, setInput] = React.useState<Partial<GambaStateInput>>({})
  const [authorityInput, setAuthorityInput] = React.useState<string>()
  const gambaStateInput = (() => {
    if (!gambaState) {
      return {
        rngAddress: "",
        gambaFee: 0,
        maxCreatorFee: 0,
        poolCreationFee: 0,
        antiSpamFee: 0,
        maxHouseEdge: 0,
        defaultPoolFee: 0,
        jackpotPayoutToUserBps: 0,
        jackpotPayoutToCreatorBps: 0,
        jackpotPayoutToPoolBps: 0,
        jackpotPayoutToGambaBps: 0,
        bonusToJackpotRatioBps: 0,
        maxPayoutBps: 0,
        poolWithdrawFeeBps: 0,
        poolCreationAllowed: false,
        poolDepositAllowed: false,
        poolWithdrawAllowed: false,
        playingAllowed: false,
        distributionRecipient: "",
      }
    }
    return {
      rngAddress: gambaState.rngAddress.toString(),
      gambaFee: gambaState.gambaFeeBps.toNumber() / 100,
      maxCreatorFee: gambaState.maxCreatorFeeBps.toNumber() / 100,
      poolCreationFee: gambaState.poolCreationFee.toNumber() / 1e9,
      antiSpamFee: gambaState.antiSpamFee.toNumber() / 1e9,
      maxHouseEdge: gambaState.maxHouseEdgeBps.toNumber() / 100,
      defaultPoolFee: gambaState.defaultPoolFee.toNumber() / 100,
      jackpotPayoutToUserBps: gambaState.jackpotPayoutToUserBps.toNumber() / 100,
      jackpotPayoutToCreatorBps: gambaState.jackpotPayoutToCreatorBps.toNumber() / 100,
      jackpotPayoutToPoolBps: gambaState.jackpotPayoutToPoolBps.toNumber() / 100,
      jackpotPayoutToGambaBps: gambaState.jackpotPayoutToGambaBps.toNumber() / 100,
      bonusToJackpotRatioBps: gambaState.bonusToJackpotRatioBps.toNumber() / 100,
      maxPayoutBps: gambaState.maxPayoutBps.toNumber() / 100,
      poolWithdrawFeeBps: gambaState.poolWithdrawFeeBps.toNumber() / 100,
      poolCreationAllowed: gambaState.poolCreationAllowed,
      poolDepositAllowed: gambaState.poolDepositAllowed,
      poolWithdrawAllowed: gambaState.poolWithdrawAllowed,
      playingAllowed: gambaState.playingAllowed,
      distributionRecipient: gambaState.distributionRecipient.toString(),
    }
  })()

  const input = { ...gambaStateInput, ..._input }

  const updateInput = (update: Partial<GambaStateInput>) => {
    setInput(input => ({ ...input, ...update }))
  }

  const initialize = async () => {
    await program.methods
      .gambaInitialize()
      .rpc()
  }

  const update = async () => {
    await sendTx(
      program.methods
        .gambaSetConfig(
          new PublicKey(input.rngAddress),
          new anchor.BN(basisPoints(Number(input.gambaFee) / 100)),
          new anchor.BN(basisPoints(Number(input.maxCreatorFee) / 100)),
          new anchor.BN(Number(input.poolCreationFee) * 1e9),
          new anchor.BN(Number(input.antiSpamFee) * 1e9),
          new anchor.BN(basisPoints(Number(input.maxHouseEdge) / 100)),
          new anchor.BN(basisPoints(Number(input.defaultPoolFee) / 100)),
          new anchor.BN(basisPoints(Number(input.jackpotPayoutToUserBps) / 100)),
          new anchor.BN(basisPoints(Number(input.jackpotPayoutToCreatorBps) / 100)),
          new anchor.BN(basisPoints(Number(input.jackpotPayoutToPoolBps) / 100)),
          new anchor.BN(basisPoints(Number(input.jackpotPayoutToGambaBps) / 100)),
          new anchor.BN(basisPoints(Number(input.bonusToJackpotRatioBps) / 100)),
          new anchor.BN(basisPoints(Number(input.maxPayoutBps) / 100)),
          new anchor.BN(basisPoints(Number(input.poolWithdrawFeeBps) / 100)),
          input.poolCreationAllowed,
          input.poolDepositAllowed,
          input.poolWithdrawAllowed,
          input.playingAllowed,
          new PublicKey(input.distributionRecipient),
        )
        .instruction(),
    )
  }

  const setAuthority = async () => {
    const newAuthority = (new Keypair).publicKey
    await program.methods
      .gambaSetAuthority(newAuthority)
      .rpc()
  }

  return (
    <>
      {!gambaState ? (
        <Button onClick={initialize}>
          Initialize Gamba
        </Button>
      ) : (
        <>
          <Flex gap="2" direction="column">
            <DetailCard title="Authority">
              <TextField.Root>
                <TextField.Input
                  value={authorityInput ?? gambaState?.authority.toBase58()}
                  onChange={e => setAuthorityInput(e.target.value)}
                />
              </TextField.Root>
            </DetailCard>
            <Button onClick={setAuthority} variant="soft">
              Update authority
            </Button>
            <DetailCard title="RNG address">
              <TextField.Root>
                <TextField.Input
                  value={input.rngAddress ?? ""}
                  onChange={e => updateInput({ rngAddress: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="DAO fee %">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.gambaFee ?? ""}
                  onChange={e => updateInput({ gambaFee: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Max creator fee (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.maxCreatorFee ?? ""}
                  onChange={e => updateInput({ maxCreatorFee: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Max house edge (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.maxHouseEdge ?? ""}
                  onChange={e => updateInput({ maxHouseEdge: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Pool creation fee (SOL)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.poolCreationFee ?? ""}
                  onChange={e => updateInput({ poolCreationFee: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Anti-spam fee (SOL)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.antiSpamFee ?? ""}
                  onChange={e => updateInput({ antiSpamFee: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Default pool fee (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.defaultPoolFee ?? ""}
                  onChange={e => updateInput({ defaultPoolFee: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Jackpot payout to user (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.jackpotPayoutToUserBps ?? ""}
                  onChange={e => updateInput({ jackpotPayoutToUserBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Jackpot payout to creator (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.jackpotPayoutToCreatorBps ?? ""}
                  onChange={e => updateInput({ jackpotPayoutToCreatorBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Jackpot payout to pool (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.jackpotPayoutToPoolBps ?? ""}
                  onChange={e => updateInput({ jackpotPayoutToPoolBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Jackpot payout to DAO (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.jackpotPayoutToGambaBps ?? ""}
                  onChange={e => updateInput({ jackpotPayoutToGambaBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Bonus to Jackpot ratio (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.bonusToJackpotRatioBps ?? ""}
                  onChange={e => updateInput({ bonusToJackpotRatioBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Max payout(%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.maxPayoutBps ?? ""}
                  onChange={e => updateInput({ maxPayoutBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Pool withdraw fee (%)">
              <TextField.Root>
                <TextField.Input
                  min={0}
                  type="number"
                  value={input.poolWithdrawFeeBps ?? ""}
                  onChange={e => updateInput({ poolWithdrawFeeBps: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <DetailCard title="Pool creation enabled">
              <input
                type="checkbox"
                checked={input.poolCreationAllowed || false}
                onChange={e => updateInput({ poolCreationAllowed: e.target.checked })}
              />
            </DetailCard>
            <DetailCard title="Pool deposit enabled">
              <input
                type="checkbox"
                checked={input.poolDepositAllowed || false}
                onChange={e => updateInput({ poolDepositAllowed: e.target.checked })}
              />
            </DetailCard>
            <DetailCard title="Pool withdraw enabled">
              <input
                type="checkbox"
                checked={input.poolWithdrawAllowed || false}
                onChange={e => updateInput({ poolWithdrawAllowed: e.target.checked })}
              />
            </DetailCard>
            <DetailCard title="Playing enabled">
              <input
                type="checkbox"
                checked={input.playingAllowed || false}
                onChange={e => updateInput({ playingAllowed: e.target.checked })}
              />
            </DetailCard>
            <DetailCard title="Distribution recipient">
              <TextField.Root>
                <TextField.Input
                  value={input.distributionRecipient ?? ""}
                  onChange={e => updateInput({ distributionRecipient: e.target.value })}
                />
              </TextField.Root>
            </DetailCard>
            <Button variant="soft" onClick={update}>
              Update
            </Button>
          </Flex>
        </>
      )}
    </>
  )
}
