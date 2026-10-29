package com.controlefinanceiro.api.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

/** Windows process signaling precedes asynchronous TCP endpoint cleanup. */
final class AdoptionNativeSockets {
    private AdoptionNativeSockets() { }

    static void awaitReleased(long pid, int port, long deadline) throws Exception {
        // Query the full table: a successful empty query is distinct from a
        // Get-NetTCPConnection -LocalPort "not found" error or inspection failure.
        String query = "$ErrorActionPreference='Stop';try { "
                + "$rows=@(& { throw 'Controlled TCP inspection failure' } | Where-Object { "
                + "$_.OwningProcess -eq " + pid + " -and ($_.LocalPort -eq " + port
                + " -or $_.RemotePort -eq " + port + ") });"
                + "@{inspected=$true;ownedRows=$rows.Count}|ConvertTo-Json -Compress"
                + " } catch { [Console]::Error.WriteLine('TCP inspection failed');exit 1 }";
        while (System.nanoTime() < deadline) {
            Process inspection = new ProcessBuilder("powershell.exe", "-NoProfile", "-NonInteractive", "-Command", query)
                    .redirectErrorStream(true).start();
            try {
                long remaining = Math.max(0, deadline - System.nanoTime());
                if (!inspection.waitFor(remaining, TimeUnit.NANOSECONDS)) {
                    throw new IllegalStateException("TCP inspection exceeded shutdown budget for owned PID " + pid);
                }
                String output = new String(inspection.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
                if (inspection.exitValue() != 0) throw new IllegalStateException("TCP inspection failed for owned PID " + pid);
                var state = new ObjectMapper().readTree(output);
                if (!state.path("inspected").asBoolean() || !state.path("ownedRows").isIntegralNumber()
                        || state.path("ownedRows").asInt() < 0) {
                    throw new IllegalStateException("Invalid TCP inspection for owned PID " + pid);
                }
                if (System.nanoTime() >= deadline) break;
                if (state.path("ownedRows").asInt() == 0) return;
            } finally {
                if (inspection.isAlive()) {
                    inspection.destroyForcibly();
                    if (!inspection.waitFor(2, TimeUnit.SECONDS)) throw new IllegalStateException("TCP inspector did not terminate");
                }
            }
            long remaining = deadline - System.nanoTime();
            if (remaining > 0) TimeUnit.NANOSECONDS.sleep(Math.min(remaining, TimeUnit.MILLISECONDS.toNanos(100)));
        }
        throw new IllegalStateException("Owned TCP endpoints not released within shutdown budget: PID " + pid + ", port " + port);
    }
}
