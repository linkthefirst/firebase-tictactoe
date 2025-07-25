import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set,
  get,
  onValue,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Debugging initialization
console.log("[DEBUG] Initializing Firebase...");

const firebaseConfig = {
  apiKey: "AIzaSyDCqQmverfWzwerVjPqZzILbi7hs3JsF9E",
  authDomain: "tictactoe4206911.firebaseapp.com",
  databaseURL: "https://tictactoe4206911-default-rtdb.firebaseio.com",
  projectId: "tictactoe4206911",
  storageBucket: "tictactoe4206911.appspot.com",
  messagingSenderId: "590795998441",
  appId: "1:590795998441:web:23204dba4908aa67165c78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Debug services
console.log("[DEBUG] Firebase Services Initialized:", {
  app: !!app,
  auth: !!auth,
  database: !!db
});

// Auth state observer (for debugging)
onAuthStateChanged(auth, (user) => {
  console.log("[DEBUG] Auth State Changed:", user ? "Logged in" : "Logged out");
  if (user) {
    console.log("[DEBUG] User Details:", {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log("[DEBUG] DOM Content Loaded");
  
  function loadUserStats(user) {
  const winsCount = document.getElementById("winsCount");
  const lossesCount = document.getElementById("lossesCount");

  if (winsCount && lossesCount && user) {
    const statsRef = ref(db, `users/${user.uid}`);
    onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      winsCount.textContent = data?.wins ?? 0;
      lossesCount.textContent = data?.losses ?? 0;
    });
  }
}


  const registerForm = document.getElementById('registrationForm');
  const loginForm = document.getElementById('loginForm');
  const showLogin = document.getElementById('showLogin');
  const showRegister = document.getElementById('showRegister');

  // Debug elements
  console.log("[DEBUG] Found Elements:", {
    registerForm: !!registerForm,
    loginForm: !!loginForm
  });

  // Tab switching
  if (showLogin && showRegister) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('user-registration').classList.remove('active');
      document.getElementById('user-login').classList.add('active');
    });
    
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('user-login').classList.remove('active');
      document.getElementById('user-registration').classList.add('active');
    });
  }

  // Login handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log("[DEBUG] Login form submitted");

      const email = loginForm['emailLogin'].value;
      const password = loginForm['passwordLogin'].value;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Logging In...';

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("[DEBUG] User logged in:", userCredential.user.uid);


        // Use the correct showMessage function
        showMessage('Login successful! You can Sign in on the Login Tab!...', 'success');
        loginForm.reset();

        // Redirect to profile tab after successful login
        setTimeout(() => {
  document.getElementById('profileTab').click();

  // Wait a tiny bit to ensure DOM has rendered Profile tab
  setTimeout(() => {
    loadUserStats(auth.currentUser);
  }, 300);
}, 2000);

      } catch (error) {
        console.error("[ERROR] Login failed:", error);
        handleAuthError(error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
      }
    });
  }

  // Registration handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log("[DEBUG] Registration form submitted");

      const email = registerForm['email'].value;
      const password = registerForm['password'].value;
      const username = registerForm['username'].value;

      // UI feedback
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating Account...';

      try {
        console.log("[DEBUG] Attempting to create user:", { email, username });

        // 1. Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("[DEBUG] User created:", userCredential.user.uid);

        // 2. Update profile
        await updateProfile(userCredential.user, { displayName: username });
        console.log("[DEBUG] Profile updated");

        // 3. Save to database
        const userData = {
          username,
          email,
          createdAt: serverTimestamp(),
          wins: 0,
          losses: 0,
          draws: 0,
          lastLogin: serverTimestamp()
        };

        await set(ref(db, `users/${userCredential.user.uid}`), userData);
        console.log("[DEBUG] User data saved to database");

        registerForm.reset();

        // Redirect to game after delay
        setTimeout(() => {
          document.getElementById('gameTab').click();
        }, 2000);

      } catch (error) {
        console.error("[ERROR] Registration failed:", error);
        handleAuthError(error);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';
      }
    });
  }

  // Enhanced message handler
  function showMessage(message, type) {
    const el = document.getElementById('registrationMessage');
    if (!el) {
      console.warn("[WARNING] Message element not found");
      return;
    }

    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = 'block';

    setTimeout(() => {
      el.style.display = 'none';
    }, 5000);
  }

  // Enhanced error handler
  function handleAuthError(error) {
    console.error("[ERROR] Auth Error:", error);

    let message = "An unexpected error occurred";
    const errorMap = {
      'auth/email-already-in-use': 'Email already registered. Try logging in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
      'auth/network-request-failed': 'Network error. Please check your connection.'
    };

    message = errorMap[error.code] || error.message;
    showMessage(message, 'error');
  }
  
  
  
  onAuthStateChanged(auth, async function(user) {
  const usernameDisplay = document.getElementById("usernameDisplay");
  if (usernameDisplay) {
    if (user) {
      let name = user.displayName || user.email.split('@')[0];  // Default to username or part before '@' in email

      // Check if custom username exists in database
      const snapshot = await get(ref(db, "users/" + user.uid + "/username"));
      if (snapshot.exists()) {
        name = snapshot.val(); // Override with the username from the database
      }

      // Display the username once logged in
      usernameDisplay.textContent = `Welcome, ${name}!`;
      
      const winsCount = document.getElementById("winsCount");
const lossesCount = document.getElementById("lossesCount");

if (winsCount && lossesCount) {
  const statsRef = ref(db, `users/${user.uid}`);
  onValue(statsRef, (snapshot) => {
    const data = snapshot.val();
    winsCount.textContent = data?.wins ?? 0;
    lossesCount.textContent = data?.losses ?? 0;
  });
}
    } else {
      // Display a default message when the user is not logged in
      usernameDisplay.textContent = `Welcome, Sign In To View Your History`;
    }
  }
});



const signOutBtn = document.getElementById("signOutBtn");

if (signOutBtn) {
  signOutBtn.addEventListener("click", function () {
    auth.signOut()
      .then(() => {
        console.log("User signed out successfully");
        document.getElementById("usernameDisplay").textContent = "Not logged in";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  });
}




});
