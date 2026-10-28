package com.controlefinanceiro.api.migration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledOnOs;
import org.junit.jupiter.api.condition.OS;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.time.Duration;
import static org.assertj.core.api.Assertions.*;

class AdoptionNativeSocketsTest {
    @EnabledOnOs(OS.WINDOWS)
    @Test void liveOwnedListenerCannotBeCertifiedReleasedOrTerminated() throws Exception {
        try (var listener = new ServerSocket()) {
            listener.bind(new InetSocketAddress("127.0.0.1", 0));
            long pid = ProcessHandle.current().pid();
            long deadline = System.nanoTime() + Duration.ofSeconds(3).toNanos();
            assertThatThrownBy(() -> AdoptionNativeSockets.awaitReleased(pid, listener.getLocalPort(), deadline))
                    .isInstanceOf(IllegalStateException.class);
            assertThat(listener.isClosed()).isFalse();
            try (var client = new java.net.Socket("127.0.0.1", listener.getLocalPort()); var accepted = listener.accept()) {
                assertThat(accepted.isConnected()).isTrue();
                assertThat(ProcessHandle.current().isAlive()).isTrue();
            }
        }
    }
}
