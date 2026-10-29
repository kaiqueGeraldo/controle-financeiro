package com.controlefinanceiro.api.support;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Explicit private runtime; historical standalone locations remain compatible. */
public final class BrowserEvidence {
    private BrowserEvidence() {}
    public static Path directory(Class<?> owner, Path historical) throws IOException {
        String runtime=System.getProperty("cf.browser.evidence");
        if(runtime==null) { Files.createDirectories(historical); return historical; }
        Path root=Path.of(runtime).toAbsolutePath().normalize();
        if(root.startsWith(Path.of(System.getProperty("user.dir")).toAbsolutePath().getParent()))
            throw new IllegalArgumentException("Private browser evidence must be outside the checkout");
        Files.createDirectories(root);
        // Never combine two invocations/classes or silently replace a failed run.
        return Files.createDirectory(root.resolve(owner.getSimpleName()));
    }
}
