import { Mint as MintEvent } from '../generated/BaseV1/BaseV1'

import { findOrCreateAccount } from './utils'

export function handleMint(event: MintEvent): void {
    const account = findOrCreateAccount(event.transaction.from, event.params.to)

    account.citizenNumber = event.params.tokenId.toI32()
    account.network = event.params.network
    account.mintedAt = event.block.timestamp
    account.updatedAt = event.block.timestamp

    account.save()
}
