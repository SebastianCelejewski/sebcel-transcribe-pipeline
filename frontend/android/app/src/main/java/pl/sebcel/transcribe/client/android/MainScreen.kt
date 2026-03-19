package pl.sebcel.transcribe.client.android

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun MainScreen(state: UploadState) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        when (state) {
            UploadState.Idle -> Text("Ready")
            UploadState.Uploading -> CircularProgressIndicator()
            UploadState.Success -> Text("Upload complete ✅")
            is UploadState.Error -> Text("Error: ${state.message}")
        }
    }
}