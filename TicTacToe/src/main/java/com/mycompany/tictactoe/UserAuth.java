package com.mycompany.tictactoe;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.FirebaseApp;
import java.io.IOException;

public class UserAuth {

    // Sign up a new user (using Admin SDK)
    public static String signUpUser(String email, String password) {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                try {
                    FirebaseInit.initializeFirebase();  // Ensure Firebase is initialized
                } catch (IOException e) {
                    return "❌ Firebase Initialization Error: " + e.getMessage();  // Handle exception here
                }
            }

            // Create the user in Firebase Authentication
            UserRecord.CreateRequest request = new UserRecord.CreateRequest()
                    .setEmail(email)
                    .setPassword(password);

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(request);

            return "✅ User created successfully! UID: " + userRecord.getUid();
        } catch (FirebaseAuthException e) {
            return "❌ Firebase Auth Error: " + e.getMessage();
        }
    }

    // Reset password functionality using Firebase Admin SDK
    public static String resetPassword(String email) {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                try {
                    FirebaseInit.initializeFirebase();  // Ensure Firebase is initialized
                } catch (IOException e) {
                    return "❌ Firebase Initialization Error: " + e.getMessage();  // Handle exception here
                }
            }

            // Generate the password reset link, but we can't directly send an email with Admin SDK
            String resetLink = FirebaseAuth.getInstance().generatePasswordResetLink(email);

            return "✅ Password reset link generated: " + resetLink;
        } catch (FirebaseAuthException e) {
            return "❌ Firebase Auth Error: " + e.getMessage();
        }
    }

    public static void main(String[] args) {
        // Example usage
        String email = "user@example.com";  // Replace with actual email
        String password = "securePassword"; // Replace with actual password

        // Sign up user
        String signUpResult = signUpUser(email, password);
        System.out.println(signUpResult);

        // Reset password (this will generate a link that the client should send to the user)
        String resetPasswordResult = resetPassword(email);
        System.out.println(resetPasswordResult);
    }
}

