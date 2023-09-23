import React, { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { Buffer } from "buffer";
import kp from "./keypair.json";
window.Buffer = Buffer;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// This is the address of your solana program, if you forgot, just run solana address -k target/deploy/myepicproject-keypair.json
// const programID = new PublicKey("8Qg7tD7ehMZfvPQrSiqiG8BpT1CeFxARSkwSzXfBBhpx");
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl("devnet");

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};
// Constants
const TEST_GIFS = [
  {
    gifLink: "https://media.giphy.com/media/3oxHQpJKupQXsmU1JS/giphy.gif",
    gifDesc: "Marvel",
  },
  {
    gifLink: "https://media.giphy.com/media/rj12FejFUysTK/giphy.gif",
    gifDesc: "Marvel",
  },
  {
    gifLink: "https://media.giphy.com/media/3o6QL31ZlTLXkW4NZS/giphy.gif",
    gifDesc: "Marvel",
  },
  {
    gifLink: "https://media.giphy.com/media/8lJwA6kNkKyfC/giphy.gif",
    gifDesc: "Marvel",
  },
  {
    gifLink: "https://media.giphy.com/media/dv01JuAyGK11zZKRv5/giphy.gif",
    gifDesc: "Marvel",
  },
  {
    gifLink: "https://media.giphy.com/media/yn0W0FsdTY5qM/giphy.gif",
    gifDesc: "Marvel",
  },
];
const TWITTER_HANDLE = "mohit20k";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputLink, setInputLink] = useState("");
  const [inputDesc, setInputDesc] = useState("");
  const [gifList, setGifList] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );

          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onLinkInputChange = (event) => {
    const { value } = event.target;
    setInputLink(value);
  };
  const onDescInputChange = (event) => {
    const { value } = event.target;
    setInputDesc(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      // const program = await getProgram();
      const program = new Program(idl, programID, provider);

      console.log("ping");

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const getProgram = async () => {
    // Get metadata about your solana program
    const idl = await Program.fetchIdl(programID, getProvider());
    console.log("idl", idl);
    // Create a program that you can call
    return new Program(idl, programID, getProvider());
  };

  const getGifList = async () => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");
      getGifList();
    }
  }, [walletAddress]);

  const sendGif = async () => {
    // if (inputLink.length > 0) {
    //   console.log("Gif link:", inputLink);
    //   console.log("Gif desc:", inputDesc);
    //   const a = { gifLink: inputLink, gifDesc: inputDesc };
    //   setGifList((current) => [...current, a]);
    //   setInputLink("");
    //   setInputDesc("");
    // } else {
    //   console.log("Empty input. Try again.");
    // }

    if (inputLink.length === 0) {
      console.log("No gif link given!");
      return;
    }
    if (inputDesc.length === 0) {
      console.log("No gif desc given!");
      return;
    }
    setInputLink("");
    setInputDesc("");
    console.log("Gif link:", inputLink);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputLink, inputDesc, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputDesc);

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  };

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}>
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className='connected-container'>
          <button
            className='cta-button submit-gif-button'
            onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    } else {
      return (
        <div className='connected-container'>
          {/* Go ahead and add this input and button to start */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}>
            <input
              type='text'
              placeholder='Enter gif link!'
              value={inputLink}
              onChange={onLinkInputChange}
            />
            <br />
            <input
              type='text'
              value={inputDesc}
              onChange={onDescInputChange}
              placeholder='Enter gif description!'
            />
            <br />
            <button type='submit' className='cta-button submit-gif-button'>
              Submit
            </button>
          </form>
          <div className='gif-grid'>
            {/* Map through gifList instead of TEST_GIFS */}
            {gifList?.map((item, index) => (
              <div className='gif-item' key={index}>
                <img src={item.gifLink} alt={"Marvel GIF"} />
                <p
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                  }}>
                  {item.gifDesc}
                </p>
                <p
                  style={{
                    color: "white",
                    marginTop: "0",
                    fontWeight: "bold",
                  }}>
                  Posted By :{" "}
                  {item.userAddress.toString().substring(0, 8) + "..."}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching GIF list...");

      // Call Solana program here.

      // Set state
      setGifList();
    }
  }, [walletAddress]);

  return (
    <div className='App'>
      {/* This was solely added for some styling fanciness */}
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className='header-container'>
          <p className='header'>GIF VERSE</p>
          <p className='sub-text'>Marvel GIF Universe ✨</p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {/* We just need to add the inverse here! */}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'>{`catch me at @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
