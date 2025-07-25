package com.mycompany.tictactoe;

import com.google.firebase.*;
import com.google.firebase.auth.*;
import com.google.firebase.FirebaseOptions;
import com.google.auth.oauth2.GoogleCredentials;

import java.io.FileInputStream;
import java.io.IOException;

public class FirebaseInit {

    // Initialize Firebase
    public static void initializeFirebase() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            FileInputStream serviceAccount = new FileInputStream("C:\\Users\\druck\\Documents\\NetBeansProjects\\TicTacToe\\tictactoe4206911-firebase-adminsdk-fbsvc-03d9cd95fb.json");

            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            FirebaseApp.initializeApp(options);
            System.out.println("✅ Firebase initialized successfully.");
        } else {
            System.out.println("✅ Firebase already initialized.");
        }
    }

    public static void main(String[] args) {
        try {
            initializeFirebase();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}


