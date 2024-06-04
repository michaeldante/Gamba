import { TokenAvatar } from "@/components"
import { SkeletonFallback, SkeletonText } from "@/components/Skeleton"
import { TableRowNavLink } from "@/components/TableRowLink"
import { TokenValue2 } from "@/components/TokenValue2"
import { SYSTEM_PROGRAM } from "@/constants"
import { decodeAta } from "@/hooks"
import { useGetTokenMeta, useTokenMeta } from "@/hooks/useTokenMeta"
import { ProgramAccount } from "@coral-xyz/anchor"
import { Avatar, Badge, Flex, Table, Text } from "@radix-ui/themes"
import { useConnection } from "@solana/wallet-adapter-react"
import { Connection, PublicKey } from "@solana/web3.js"
import { PoolState, decodePool, getPoolBonusUnderlyingTokenAccountAddress, getPoolJackpotTokenAccountAddress, getPoolLpAddress, getPoolUnderlyingTokenAccountAddress } from "gamba-core-v2"
import { useGambaProgram } from "gamba-react-v2"
import React from "react"
import styled from "styled-components"
import useSWR from "swr"

const StyledTableCell = styled(Table.Cell)`
  vertical-align: middle;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`

export interface UiPool {
  publicKey: PublicKey
  underlyingTokenMint: PublicKey
  poolAuthority: PublicKey
  state: PoolState
  liquidity: bigint
  lpSupply: bigint
  ratio: number
  bonusBalance: bigint
  jackpotBalance: bigint
  plays: number
}

const populatePool = async (
  connection: Connection,
  publicKey: PublicKey,
  state: PoolState,
): Promise<UiPool> => {
  const { value: lp } = await connection.getTokenSupply(getPoolLpAddress(publicKey))
  const underlyingAccount = decodeAta(await connection.getAccountInfo(getPoolUnderlyingTokenAccountAddress(publicKey)))
  const bonusUnderlyingTokenAccount = decodeAta(await connection.getAccountInfo(getPoolBonusUnderlyingTokenAccountAddress(publicKey)))
  const underlyingBalance = underlyingAccount?.amount ?? BigInt(0)
  const bonusBalance = bonusUnderlyingTokenAccount?.amount ?? BigInt(0)
  const jackpotUnderlyingTokenAccount = decodeAta(await connection.getAccountInfo(getPoolJackpotTokenAccountAddress(publicKey)))
  const jackpotBalance = jackpotUnderlyingTokenAccount?.amount ?? BigInt(0)
  const lpSupply = BigInt(lp.amount)
  const ratio = !lpSupply ? 1 : Number(underlyingBalance) / Number(lpSupply)
  return {
    publicKey,
    state,
    liquidity: underlyingBalance,
    underlyingTokenMint: state.underlyingTokenMint,
    lpSupply,
    bonusBalance,
    jackpotBalance,
    ratio,
    poolAuthority: state.poolAuthority,
    plays: Number(state.plays),
  }
}

function PoolTableRow({ pool }: { pool: ProgramAccount<PoolState> }) {
  const populated = usePopulatedPool(pool)
  const token = useTokenMeta(pool.account.underlyingTokenMint)

  return (
    <TableRowNavLink to={"/pool/" + pool.publicKey.toBase58()}>
      <StyledTableCell>
        <Flex gap="4" align="center">
          <TokenAvatar mint={pool.account.underlyingTokenMint} size="2" />
          <Text>{token.name}</Text>
          <Text size="2" color="gray">
            {token.symbol}
          </Text>
          {!pool.account.poolAuthority.equals(SYSTEM_PROGRAM) ? (
            <Badge color="orange">PRIVATE</Badge>
          ) : (
            <Badge color="green">PUBLIC</Badge>
          )}
        </Flex>
      </StyledTableCell>
      <StyledTableCell>
        <SkeletonFallback loading={populated.isLoading}>
          <Flex align="center">
            <TokenValue2
              mint={pool.account.underlyingTokenMint}
              amount={Number(populated.data?.liquidity)}
            />
          </Flex>
        </SkeletonFallback>
      </StyledTableCell>
      <StyledTableCell>
        <SkeletonFallback loading={populated.isLoading}>
          <Flex align="center">
            <TokenValue2
              dollar
              mint={pool.account.underlyingTokenMint}
              amount={Number(populated.data?.liquidity)}
            />
          </Flex>
        </SkeletonFallback>
      </StyledTableCell>
      <StyledTableCell>
        <SkeletonFallback loading={populated.isLoading}>
          {populated.data?.ratio.toFixed(3)}
        </SkeletonFallback>
      </StyledTableCell>
    </TableRowNavLink>
  )
}

export async function fetchPool(connection: Connection, publicKey: PublicKey) {
  const accountInfo = await connection.getAccountInfo(publicKey)
  const pool = decodePool(accountInfo)
  if (!pool) return null
  return await populatePool(connection, publicKey, pool)
}

export function usePopulatedPool(account: ProgramAccount<PoolState>) {
  const { connection } = useConnection()
  return useSWR("populated-pool-" + account.publicKey.toBase58(), () => populatePool(connection, account.publicKey, account.account))
}

export function PoolList({limit = Infinity}: {limit?: number}) {
  const program = useGambaProgram()
  const getTokenMeta = useGetTokenMeta()
  const { data: pools = [], isLoading: isLoadingPools } = useSWR("pools", () => program.account.pool.all())

  const sortedPools = React.useMemo(
    () => {
      return pools.sort((a, b) => {
        const aMeta = getTokenMeta(a.account.underlyingTokenMint)
        const bMeta = getTokenMeta(b.account.underlyingTokenMint)
        const aTvl = a.account.liquidityCheckpoint * aMeta.usdPrice / (10 ** aMeta.decimals)
        const bTvl = b.account.liquidityCheckpoint * bMeta.usdPrice / (10 ** bMeta.decimals)
        const tvlDiff = bTvl - aTvl
        if (tvlDiff) return tvlDiff
        const playsDiff = b.account.plays.toNumber() - a.account.plays.toNumber()
        if (playsDiff) return playsDiff
        const liqudityDiff = b.account.liquidityCheckpoint - a.account.liquidityCheckpoint
        if (liqudityDiff) return liqudityDiff
        return a.publicKey.toString() > b.publicKey.toString() ? 1 : -1
      })
    },
    [getTokenMeta, pools],
  )

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Pool</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Liquidity</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>TVL</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Ratio</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {isLoadingPools ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Table.Row key={i}>
                <StyledTableCell>
                  <Flex gap="4" align="center">
                    <Avatar
                      fallback="-"
                      size="2"
                    />
                    <SkeletonText style={{ width: "150px" }} />
                  </Flex>
                </StyledTableCell>
                {Array.from({ length: 4 }).map((_, i) => (
                  <StyledTableCell key={i}>
                    <SkeletonText />
                  </StyledTableCell>
                ))}
              </Table.Row>
            ))}
          </>
        ) : (
          <>
            {sortedPools.slice(0, limit).map(pool => (
              <PoolTableRow
                key={pool.publicKey.toBase58()}
                pool={pool}
              />
            ))}
          </>
        )}
      </Table.Body>
    </Table.Root>
  )
}
