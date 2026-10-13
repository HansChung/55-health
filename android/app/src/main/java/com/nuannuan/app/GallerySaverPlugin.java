package com.nuannuan.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 存到手機相簿（暖暖 App）：把影片／照片的網址下載下來，直接放進相簿的「暖暖」資料夾。
 * Android 10 以上用 MediaStore（不用權限）；Android 7～9 要「儲存空間」權限，存到 Movies／Pictures/暖暖 再通知相簿掃描。
 * JS：registerPlugin("GallerySaver").save({ url, mime, filename })
 */
@CapacitorPlugin(
    name = "GallerySaver",
    permissions = { @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage") }
)
public class GallerySaverPlugin extends Plugin {

    private static final String FOLDER = "暖暖";
    private static final int TIMEOUT_MS = 60_000;

    @PluginMethod
    public void save(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) {
            call.reject("bad url");
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }
        saveInBackground(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            saveInBackground(call);
        } else {
            call.reject("permission denied", "PERMISSION_DENIED");
        }
    }

    private void saveInBackground(PluginCall call) {
        new Thread(() -> {
            try {
                String saved = download(call.getString("url"), safeName(call.getString("filename", "nuannuan")), call.getString("mime", "video/mp4"));
                JSObject ret = new JSObject();
                ret.put("uri", saved);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("save failed: " + e.getMessage());
            }
        }).start();
    }

    private static String safeName(String name) {
        String n = name.replaceAll("[\\\\/:*?\"<>|\\n\\r]", "_").trim();
        return n.isEmpty() ? "nuannuan" : n;
    }

    private String download(String url, String filename, String mime) throws Exception {
        boolean video = mime.startsWith("video/");
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        try {
            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) throw new Exception("HTTP " + code);
            try (InputStream in = conn.getInputStream()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    return saveWithMediaStore(in, filename, mime, video);
                }
                return saveLegacy(in, filename, mime, video);
            }
        } finally {
            conn.disconnect();
        }
    }

    /** Android 10 以上：MediaStore（相簿立刻看得到，不用權限） */
    private String saveWithMediaStore(InputStream in, String filename, String mime, boolean video) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mime);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, (video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES) + "/" + FOLDER);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri collection = video
            ? MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            : MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        Uri item = resolver.insert(collection, values);
        if (item == null) throw new Exception("insert failed");
        try (OutputStream out = resolver.openOutputStream(item)) {
            if (out == null) throw new Exception("open failed");
            copy(in, out);
        } catch (Exception e) {
            resolver.delete(item, null, null);
            throw e;
        }
        values.clear();
        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(item, values, null, null);
        return item.toString();
    }

    /** Android 7～9：存到公開資料夾，再請相簿掃描 */
    @SuppressWarnings("deprecation")
    private String saveLegacy(InputStream in, String filename, String mime, boolean video) throws Exception {
        File dir = new File(Environment.getExternalStoragePublicDirectory(video ? Environment.DIRECTORY_MOVIES : Environment.DIRECTORY_PICTURES), FOLDER);
        if (!dir.exists() && !dir.mkdirs()) throw new Exception("mkdir failed");
        File file = new File(dir, filename);
        try (OutputStream out = new FileOutputStream(file)) {
            copy(in, out);
        }
        MediaScannerConnection.scanFile(getContext(), new String[] { file.getAbsolutePath() }, new String[] { mime }, null);
        return Uri.fromFile(file).toString();
    }

    private static void copy(InputStream in, OutputStream out) throws Exception {
        byte[] buf = new byte[64 * 1024];
        int n;
        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        out.flush();
    }
}
