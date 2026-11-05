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

    public static Process start(ProcessBuilder builder, Class<?> owner, Path evidence) throws IOException {
        String configured=builder.environment().get("CF_SOURCE_ROOT");
        Path root=configured==null?Path.of(System.getProperty("user.dir")).toAbsolutePath().getParent():Path.of(configured);
        var original=new java.util.ArrayList<>(builder.command());
        if(!original.get(1).endsWith("wrapper-browser.mjs")) {
            var command=new java.util.ArrayList<String>();
            command.add(original.get(0));command.add(root.resolve(".github/scripts/wrapper-browser.mjs").toString());
            command.add("--wrapper");command.add(owner.getSimpleName());command.add("--entry");
            command.addAll(original.subList(1,original.size()));builder.command(command);
        }
        builder.environment().put("CF_REVIEW_EVIDENCE",evidence.toAbsolutePath().toString());
        return builder.start();
    }
    public static boolean waitFor(Process process,long timeout,java.util.concurrent.TimeUnit unit,Path evidence)
            throws InterruptedException,IOException {
        try {
            boolean completed=process.waitFor(timeout,unit);
            if(!completed) Files.writeString(evidence.resolve("interruption.json"),
                    "{\"reason\":\"timeout\",\"timeoutMs\":"+unit.toMillis(timeout)+"}",java.nio.file.StandardOpenOption.CREATE_NEW);
            return completed;
        } catch(InterruptedException interrupted) {
            Files.writeString(evidence.resolve("interruption.json"),"{\"reason\":\"interrupted\"}",java.nio.file.StandardOpenOption.CREATE_NEW);
            throw interrupted;
        }
    }

}
