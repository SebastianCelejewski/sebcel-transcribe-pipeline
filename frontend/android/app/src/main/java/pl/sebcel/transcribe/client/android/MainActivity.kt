package pl.sebcel.transcribe.client.android

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import java.io.InputStream
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_SEND) {
            val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)

            if (uri != null) {
                Log.d("TRANSCRIBE", "Received file: $uri")
                Thread {
                    uploadFile(uri)
                }.start()
            } else {
                Log.e("TRANSCRIBE", "No file received")
            }
        }
    }

    private fun uploadFile(uri: Uri) {
        val file = copyToTempFile(uri)

        if (file == null) {
            Log.e("TRANSCRIBE", "Failed to read file")
            return
        }

        val presignedUrl = getUploadUrl()

        if (presignedUrl == null) {
            Log.e("TRANSCRIBE", "Failed to get upload URL")
            return
        }

        uploadToS3(file, presignedUrl)
    }

    private fun copyToTempFile(uri: Uri): File? {
        return try {
            val inputStream: InputStream? = contentResolver.openInputStream(uri)
            val file = File(cacheDir, "upload.mp3")

            val outputStream = FileOutputStream(file)
            inputStream?.copyTo(outputStream)

            outputStream.close()
            inputStream?.close()

            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun getUploadUrl(): String? {
        Log.d("TRANSCRIBE", "getUploadUrl() start")
        val client = OkHttpClient()

        val request = Request.Builder()
            .url("https://opdujm96sl.execute-api.sa-east-1.amazonaws.com/get-upload-url")
            .post(RequestBody.create(null, ByteArray(0)))
            .addHeader("Authorization", "Bearer XXXXXX")
            .build()

        Log.d("TRANSCRIBE", "getUploadUrl() sending get-upload-url request")

        client.newCall(request).execute().use { response ->
            Log.d("TRANSCRIBE", "getUploadUrl() response.isSuccessful: " + response.isSuccessful)
            val body = response.body?.string()

            if (!response.isSuccessful || body == null) {
                Log.e("TRANSCRIBE", "Failed to get upload URL")
                return null
            }

            val json = JSONObject(body)
            val uploadUrl = json.getString("uploadUrl")

            Log.d("TRANSCRIBE", "Parsed upload URL: $uploadUrl")

            return uploadUrl
        }
    }

    private fun uploadToS3(file: File, url: String) {
        Log.d("TRANSCRIBE", "uploadToS3() start")
        val client = OkHttpClient()

        val request = Request.Builder()
            .url(url)
            .put(file.asRequestBody("audio/mpeg".toMediaType()))
            .build()

        Log.d("TRANSCRIBE", "uploadToS3() sending request")
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: java.io.IOException) {
                Log.e("TRANSCRIBE", "Upload failed", e)
            }

            override fun onResponse(call: Call, response: Response) {
                Log.d("TRANSCRIBE", "Upload success: ${response.code}")
            }
        })
    }
}