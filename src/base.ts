import { Address, Bytes } from '@graphprotocol/graph-ts'

import {
  ExecutePurchase as ExecutePurchaseEvent,
  ExecuteReserve as ExecuteReserveEvent,
  ExecuteClaim as ExecuteClaimEvent,
  ContractCall as ContractCallEvent,
} from '../generated/BaseV1/BaseV1'
import { ExecutePurchase, ExecuteReserve, ExecuteClaim, Citizen } from '../generated/schema'
import { findAndUpsertCitizen } from './utils'

const ZERO_ADDRESS = Address.zero()
/** Compare with the message id of Optimism that Axelar uses to determine if the network is Optimism,
 * meaning the action is synchronous
 * @todo - Capture these synchronous actions on PassportV1 and remove this
 */
const isOptimismChain = (network: Bytes): boolean => {
  return network.toHexString().toLowerCase() == '0x09d0f27659ee556a8134fa56941e42400e672aecc2d4cfc61cdb0fcea4590e05'
}

export function handleExecutePurchase(event: ExecutePurchaseEvent): void {
  const executePurchase = new ExecutePurchase(event.transaction.hash)

  executePurchase.network = event.params.network.toHexString()
  executePurchase.sender = event.params.sender
  executePurchase.referrer = event.params.referrer
  executePurchase.tokenId = event.params.tokenId.toI32()
  executePurchase.success = event.params.success

  executePurchase.save()

  if (executePurchase.success && isOptimismChain(event.params.network)) {
    findAndUpsertCitizen(
      event,
      Address.fromBytes(executePurchase.sender),
      event.transaction.to!,
      executePurchase.tokenId,
      'optimism',
      executePurchase.referrer != ZERO_ADDRESS ? 1 : 0
    )
    if (executePurchase.referrer != ZERO_ADDRESS) {
      const citizen = Citizen.load(event.transaction.to!.toHexString() + '_' + executePurchase.referrer.toHexString())
      if (!citizen) return

      citizen.referralCount = (citizen.referralCount || 0) + 1
      citizen.save()
    }
  }
}

export function handleExecuteReserve(event: ExecuteReserveEvent): void {
  const executeReserve = new ExecuteReserve(event.transaction.hash)

  executeReserve.network = event.params.network.toHexString()
  executeReserve.paymentId = event.params.paymentId.toI32()
  executeReserve.assignments = event.params.assignments.length
  executeReserve.sender = event.params.sender
  executeReserve.referred = event.params.referred
  executeReserve.success = event.params.success

  executeReserve.save()

  if (event.params.referred && executeReserve.success && isOptimismChain(event.params.network)) {
    findAndUpsertCitizen(
      event,
      Address.fromBytes(executeReserve.sender),
      event.transaction.to!,
      0,
      null,
      executeReserve.referred ? executeReserve.assignments : 0
    )
  }
}

export function handleContractCall(event: ContractCallEvent): void {
  const executePurchase = ExecutePurchase.load(event.transaction.hash)
  const executeClaim = ExecuteClaim.load(event.transaction.hash)

  if (executePurchase && executePurchase.success) {
    findAndUpsertCitizen(
      event,
      Address.fromBytes(executePurchase.sender),
      Address.fromString(event.params.destinationContractAddress),
      executePurchase.tokenId,
      event.params.destinationChain,
      executePurchase.referrer != ZERO_ADDRESS ? 1 : 0
    )

    if (executePurchase.referrer != ZERO_ADDRESS) {
      const citizen = Citizen.load(event.transaction.to!.toHexString() + '_' + executePurchase.referrer.toHexString())
      if (!citizen) return

      citizen.referralCount = (citizen.referralCount || 0) + 1
      citizen.save()
    }
  }

  if (executeClaim) {
    findAndUpsertCitizen(
      event,
      Address.fromBytes(executeClaim.sender),
      Address.fromString(event.params.destinationContractAddress),
      executeClaim.tokenId,
      event.params.destinationChain,
      0
    )
  }
}

export function handleExecuteClaim(event: ExecuteClaimEvent): void {
  const claim = new ExecuteClaim(event.transaction.hash)

  claim.sender = event.params.sender
  claim.tokenId = event.params.tokenId.toI32()

  claim.save()
}
