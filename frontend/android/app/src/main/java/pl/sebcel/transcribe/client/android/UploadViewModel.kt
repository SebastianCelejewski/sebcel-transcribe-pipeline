package pl.sebcel.transcribe.client.android

import android.app.Application
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

class UploadViewModel(app: Application) : AndroidViewModel(app) {

    var state by mutableStateOf<UploadState>(UploadState.Idle)
        private set

    fun upload(uri: Uri) {
        state = UploadState.Uploading

        viewModelScope.launch(Dispatchers.IO) {
            try {
                val file = copyToTempFile(uri) ?: throw Exception("File error")
                val url = getUploadUrl() ?: throw Exception("No URL")

                uploadToS3(file, url)

                state = UploadState.Success
            } catch (e: Exception) {
                state = UploadState.Error(e.message ?: "Unknown error")
            }
        }
    }

    private fun copyToTempFile(uri: Uri): File? {
        val context = getApplication<Application>()
        val input = context.contentResolver.openInputStream(uri) ?: return null
        val file = File(context.cacheDir, "upload.mp3")

        FileOutputStream(file).use { output ->
            input.copyTo(output)
        }

        return file
    }

    private fun getUploadUrl(): String? {
        val client = OkHttpClient()

        val request = Request.Builder()
            .url("https://opdujm96sl.execute-api.sa-east-1.amazonaws.com/get-upload-url")
            .post(ByteArray(0).toRequestBody(null, 0, 0))
            .addHeader("Authorization", "Bearer YOUR_TOKEN")
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body.string()
            val json = JSONObject(body)
            return json.getString("uploadUrl")
        }
    }

    private fun uploadToS3(file: File, url: String) {
        val client = OkHttpClient()

        val request = Request.Builder()
            .url(url)
            .put(file.asRequestBody("audio/mpeg".toMediaType()))
            .build()

        client.newCall(request).execute()
    }
}