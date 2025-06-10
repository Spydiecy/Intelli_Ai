import { http } from "viem";
import { Account, privateKeyToAccount, Address } from "viem/accounts";
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";

const privateKey: Address = `0x${process.env.WALLET_PRIVATE_KEY}`;
const account: Account = privateKeyToAccount(privateKey);

const config: StoryConfig = {
  account: account, // the account object from above
  transport: http("https://aeneid.storyrpc.io"),
  chainId: "aeneid",
};
export const client = StoryClient.newClient(config);