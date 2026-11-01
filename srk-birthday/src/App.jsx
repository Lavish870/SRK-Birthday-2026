
import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "./firebase";
import AsciiVideo from "./AsciiVideo";
import "./App.css";

// Background Matrix columns
const streams = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left: `${(i / 35) * 100}%`,
  delay: `${Math.random() * -15}s`,
  duration: `${8 + Math.random() * 12}s`
}));

function App() {

  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);
  const [hasWished, setHasWished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [party, setParty] = useState(false);
  const [error, setError] = useState("");

  // ==================================
  // 1. FIREBASE ANONYMOUS AUTHENTICATION
  // ==================================

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);

        if (!currentUser) {
          signInAnonymously(auth).catch((err) => {
            console.error("Authentication error:", err);
            setError("Authentication failed. Please refresh.");
          });
        }

      }
    );

    return unsubscribe;

  }, []);

  // ==================================
  // 2. GLOBAL LIVE WISH COUNTER
  // ==================================

  useEffect(() => {

    const counterRef = doc(
      db,
      "birthdayStats",
      "srk2026"
    );

    const unsubscribe = onSnapshot(
      counterRef,

      (snapshot) => {

        if (snapshot.exists()) {
          setCount(snapshot.data().count || 0);
        }

        setLoading(false);

      },

      (err) => {

        console.error("Counter error:", err);
        setError("Unable to load global counter.");
        setLoading(false);

      }
    );

    return unsubscribe;

  }, []);

  // ==================================
  // 3. CHECK EXISTING FAN WISH
  // ==================================

  useEffect(() => {

    if (!user) return;

    const wishRef = doc(
      db,
      "birthdayWishes",
      user.uid
    );

    const unsubscribe = onSnapshot(
      wishRef,

      (snapshot) => {
        setHasWished(snapshot.exists());
      },

      (err) => {
        console.error("Wish check error:", err);
      }
    );

    return unsubscribe;

  }, [user]);

  // ==================================
  // 4. SEND BIRTHDAY WISH
  // ==================================

  const sendWish = async () => {

    if (!user || hasWished || loading) return;

    setLoading(true);
    setError("");

    try {

      const counterRef = doc(
        db,
        "birthdayStats",
        "srk2026"
      );

      const wishRef = doc(
        db,
        "birthdayWishes",
        user.uid
      );

      await runTransaction(
        db,
        async (transaction) => {

          const counterSnapshot =
            await transaction.get(counterRef);

          const wishSnapshot =
            await transaction.get(wishRef);

          // Prevent duplicate wishes
          if (wishSnapshot.exists()) {
            return;
          }

          if (!counterSnapshot.exists()) {
            throw new Error("Counter document not found.");
          }

          const currentCount =
            counterSnapshot.data().count || 0;

          // Increment global counter
          transaction.update(counterRef, {
            count: currentCount + 1
          });

          // Create fan's wish document
          transaction.set(wishRef, {
            createdAt: serverTimestamp()
          });

        }
      );

      setParty(true);

      setTimeout(() => {
        setParty(false);
      }, 4000);

    } catch (err) {

      console.error("Wish submission error:", err);

      setError(
        "Your wish could not be sent. Please try again."
      );

    } finally {

      setLoading(false);

    }

  };

  // ==================================
  // 5. WEBSITE UI
  // ==================================

  return (

    <main className="app">

      {/* MATRIX BACKGROUND */}

      <div className="ascii-rain">

        {streams.map((stream) => (

          <pre
            key={stream.id}
            style={{
              left: stream.left,
              animationDelay: stream.delay,
              animationDuration: stream.duration
            }}
          >
            {"01\n10\nSRK\n11\n00\nKHAN\nKING\n"}

          </pre>

        ))}

      </div>


      {/* MAIN THREE COLUMN LAYOUT */}

      <div className="birthday-container">


        {/* ==================================
            LEFT PANEL - TEAM SRK LUCKNOW
        ================================== */}

        <aside className="desktop-left">

          <div className="team-footer">

            <span className="footer-line"></span>

            <p>
              MADE WITH{" "}
              <span className="heart">♥</span>
              {" "}AND ADMIRATION
            </p>

            <h3>
              A HEARTFELT FAN
            </h3>

            <span className="footer-tagline">
              WITH LOVE, FROM LAVISH
            </span>

            <span className="footer-line"></span>

          </div>

        </aside>


        {/* ==================================
            CENTRE PANEL - BIRTHDAY EXPERIENCE
        ================================== */}

        <section className="desktop-center">

          {/* Birthday heading */}

          <header className="top-overlay">

            <span className="overline">
              02 NOVEMBER · A DAY FOR THE KING
            </span>

            <h1>
              HAPPY BIRTHDAY
            </h1>

            <h2>
              TO THE KING OF BOLLYWOOD
            </h2>

            <p>
              AND THE ENTIRE WORLD{" "}
              <span>♥</span>
            </p>

          </header>


          {/* ASCII VIDEO ANIMATION */}

          <section className="srk-stage">

            <div className="srk-glow">
              KING KHAN
            </div>

            <AsciiVideo />

            <div className="pose-caption">
              THE KING. THE LEGACY. THE MAGIC.
            </div>

          </section>

        </section>


        {/* ==================================
            RIGHT PANEL - GLOBAL FAN COUNTER
        ================================== */}

        <aside className="desktop-right">


          {/* Global counter */}

          <section className="counter">

            <span className="counter-label">
              THE GLOBAL FAN CELEBRATION
            </span>

            <strong>
              {count.toLocaleString("en-IN")}
            </strong>

            <span className="live-indicator">

              <span className="live-dot"></span>

              LIVE WISHES FROM AROUND THE WORLD

            </span>

          </section>


          {/* Wish button */}

          <section className="wish-section">

            <button
              className="wish-button"
              onClick={sendWish}
              disabled={!user || loading || hasWished}
            >

              {hasWished
                ? "♥ WISH SENT TO THE KING"
                : loading
                  ? "CONNECTING..."
                  : "♛ SEND YOUR WISH"}

            </button>

            <p className="wish-note">
              Be a part of the celebration.
              Send some love!
            </p>

          </section>


          {/* Error message */}

          {error && (

            <div className="error">
              {error}
            </div>

          )}

        </aside>

      </div>


      {/* ==================================
          PARTY CELEBRATION OVERLAY
      ================================== */}

      {party && (

        <div className="party-overlay">

          {Array.from({ length: 50 }, (_, i) => (

            <span
              key={i}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`
              }}
            >

              {["01", "10", "★", "♥", "SRK"][i % 5]}

            </span>

          ))}

          <h2>
            YOUR WISH IS IN! ♥
          </h2>

        </div>

      )}

    </main>

  );

}

export default App;
