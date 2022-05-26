//=============================================================================
// RPG Maker MZ - Ethers Bridge For RPG Maker MZ
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Connect your wallet with RM MZ!
 * @author iketiunn
 *
 * @help Ethers.js
 * 
 * This plugin pops wallet connect to make you login with your wallet
 * It adds the ability to use ethers.js in your game.
 * 
 * ethers.js docs: https://docs.ethers.io/v5/
 * 
 * @param DEV_PRIVATE_KEY
 * @text Wallet private key
 * @type string
 * @desc Wallet private key during developing.
 * @default ""
 * 
 * @param ETHERSCAN_API_KEY
 * @text Etherscan api key
 * @type string
 * @desc For query on chain data
 * @default ""
 * 
 * @command sign_in
 * @text Sign in wallet
 * @desc Sign in wallet with different methods
 *
 * @command get_user_assets
 * @text Get user's assets
 * @desc Get user's assets from the specific contract
 */
(async () => {
  const FILE_NAME = 'Ethers'
  const userParams = PluginManager.parameters(FILE_NAME)
  const DEV_PRIVATE_KEY = userParams['DEV_PRIVATE_KEY'] || ""
  // TODO: gateway url + key
  const ETHERSCAN_API_KEY = userParams['ETHERSCAN_API_KEY'] || ""
  // TODO: set provider network
  

  /**
   * Private Variables:
   * 
   * starts with $ -> user defined
   * start with _ -> system defined, not not change it
   */
  const provider = ethers.getDefaultProvider("homestead", {
    etherscan: ETHERSCAN_API_KEY
  });
  let $privateKey = DEV_PRIVATE_KEY // Or user input
  let _wallet
  // pseudo abi and address from BYAC
  const $contractAddress = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
  const _abi = await fetch(`https://api.etherscan.io/api?module=contract&action=getabi&address=${$contractAddress}`)
    .then(res => res.json())
    .then(json => json.result)
  console.debug($contractAddress, _abi)
  const _contract = new ethers.Contract($contractAddress, _abi, provider);

  /**
   * Main
   */
  PluginManager.registerCommand(FILE_NAME, "sign_in", async args =>
    // Chose a way to sign in, private key only now
    _wallet = await signInCommand({
      privateKey: $privateKey
    })
  )

  PluginManager.registerCommand(FILE_NAME, "get_user_assets", async args => {
    const somebodyAddress = '0xB5bD85e680606C9d1d824A40589AF762ACB376B7' // TODO: Should current signer
    const assets = await getUsersAssetsCommand(_contract, somebodyAddress)
    if (assets.length === 0) {
      $gameMessage.add("0 assets found...")
      return
    }
    $gameMessage.add(`${assets.length} assets found...\nOpen the first one.`)  
    showNFT(assets[0].imageUrl)
  })
})()

/**
 * Private functions
 */

async function signInCommand({
  privateKey
}) {
  if (privateKey !== "") {
    wallet = new ethers.Wallet(privateKey);
    console.log('Load wallet from given private key')

    return wallet
  }

  wallet = ethers.Wallet.createRandom();
  console.log('Random wallet created...')
  console.debug('address:', wallet.address)
  console.debug('mnemonic:', wallet.mnemonic.phrase)
  console.debug('privateKey:', wallet.privateKey)

  return wallet
}

async function getCollectionsFromMarket() {


}

async function getUsersAssetsCommand(contract, userAddress) {
  const assets = []
  await contract.balanceOf(userAddress).then(async balance => {
    console.debug(userAddress, 'total balance:', balance)
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i)
      const uri = await contract.tokenURI(tokenId)
      const url = `https://ipfs.io/ipfs/${uri.split("ipfs://")[1]}` // TODO: temp, find a proper gateway
      const json = await fetch(url).then(res => res.json()) // TODO: handle error
      const imageUri = json.image
      const imageUrl = `https://cloudflare-ipfs.com/ipfs/${imageUri.split("ipfs://")[1]}` // TODO: temp, find a proper gateway
      // Also you can use the tokenId to map to the in-game item
      assets.push({
        ...json,
        imageUrl
      })
    }
  })

  return assets
}

async function showNFT(url) {
  const bitmap = ImageManager.loadBitmapFromUrl(url)
  const img = new Sprite(bitmap);
  SceneManager._scene.addChildAt(img, 2) // TODO: positioning
  // TODO: scale based on relative size
  img.scale.x = 0.4
  img.scale.y = 0.4
  img._refresh()

  setTimeout(() => img.destroy(), 5000)
}


async function mintRandomNFT(contract, userAddress) {


}