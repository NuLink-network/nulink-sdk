import { ethers } from 'ethers'

export const signMessage = async (
  privateKey: string,
  message: string,
): Promise<string> => {
  const wallet = new ethers.Wallet(privateKey)

  const signature = await wallet.signMessage(message)

  return signature
}

export const verifyMessage = (
  message: string,
  signature: string,
  expectedAddress: string,
): boolean => {
  // Approach 1
  const actualAddress = ethers.utils.verifyMessage(message, signature)

  return expectedAddress.toLowerCase().trim() === actualAddress.toLowerCase().trim()
}
