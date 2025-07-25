package com.mycompany.tictactoe;

import com.google.firebase.auth.*;
import com.google.firebase.FirebaseApp;
import java.io.IOException;

// Import FirebaseInit to initialize Firebase
import com.mycompany.tictactoe.FirebaseInit;

public class UserRegistration {

    // Sign up a new user
    public static String signUpUser(String email, String password) {
        try {
            // Initialize Firebase (check if it's initialized only once)
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseInit.initializeFirebase();  // Initialize Firebase if it's not already initialized
            }

            // Creating a user with email and password
            UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password);

            // Create the user in Firebase Authentication
            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);

            // Return the UID of the newly created user
            return "✅ User created successfully! UID: " + userRecord.getUid();

        } catch (FirebaseAuthException e) {
            // Handle Firebase Auth specific errors
            return "❌ Firebase Auth Error: " + e.getMessage();
        } catch (IOException e) {
            // Handle initialization errors
            return "❌ Firebase Initialization Error: " + e.getMessage();
        } catch (Exception e) {
            // Catch all other exceptions
            return "❌ Error: " + e.getMessage();
        }
    }

    public static void main(String[] args) {
        try {
            // Ensure Firebase is initialized before performing any operations
            FirebaseInit.initializeFirebase();
            
            String email = "user@example.com";  // Replace with actual email
            String password = "securePassword"; // Replace with actual password
            String result = signUpUser(email, password);
            System.out.println(result);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

