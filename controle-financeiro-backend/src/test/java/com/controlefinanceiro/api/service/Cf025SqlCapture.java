package com.controlefinanceiro.api.service;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import javax.sql.DataSource;
import java.lang.reflect.*;
import java.sql.*;
import java.util.*;

/** Test-only capture at the JDBC boundary. No production query or collaborator is mocked. */
@TestConfiguration
public class Cf025SqlCapture {
    private static final ThreadLocal<List<Query>> ACTIVE = new ThreadLocal<>();

    record Binding(Method method, Object[] arguments) {}
    record Query(String sql, List<Binding> bindings) {
        boolean isSelect() {
            String normalized = sql.stripLeading().toLowerCase(Locale.ROOT);
            return normalized.startsWith("select") || normalized.startsWith("with");
        }
        String explain(Connection connection) throws Exception {
            try (var statement = connection.prepareStatement("EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) " + sql)) {
                for (var binding : bindings) invoke(binding.method(), statement, binding.arguments());
                try (var rows = statement.executeQuery()) {
                    var plan = new StringBuilder();
                    while (rows.next()) plan.append(rows.getString(1)).append('\n');
                    return plan.toString();
                }
            }
        }
    }

    static List<Query> start() {
        var queries = new ArrayList<Query>();
        ACTIVE.set(queries);
        return queries;
    }
    static void stop() { ACTIVE.remove(); }

    @Bean static BeanPostProcessor captureDataSource() {
        return new BeanPostProcessor() {
            @Override public Object postProcessAfterInitialization(Object bean, String name) {
                if (!(bean instanceof DataSource source)) return bean;
                // Preserve pool disposal when Spring closes this dedicated test context.
                return Proxy.newProxyInstance(DataSource.class.getClassLoader(), new Class<?>[]{DataSource.class, AutoCloseable.class},
                        (proxy, method, args) -> {
                            Object result = invoke(method, source, args);
                            return result instanceof Connection connection ? wrap(connection) : result;
                        });
            }
        };
    }

    private static Connection wrap(Connection connection) {
        return (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[]{Connection.class},
                (proxy, method, args) -> {
                    Object result = invoke(method, connection, args);
                    if (!(result instanceof PreparedStatement statement) || !method.getName().equals("prepareStatement")) return result;
                    String sql = (String) args[0];
                    Map<Integer, Binding> bindings = new TreeMap<>();
                    return Proxy.newProxyInstance(PreparedStatement.class.getClassLoader(), new Class<?>[]{PreparedStatement.class},
                            (p, m, a) -> {
                                if (m.getName().startsWith("set") && a != null && a.length >= 2 && a[0] instanceof Integer index) {
                                    bindings.put(index, new Binding(m, a.clone()));
                                }
                                if (m.getName().equals("clearParameters")) bindings.clear();
                                if (m.getName().startsWith("execute") && ACTIVE.get() != null) {
                                    ACTIVE.get().add(new Query(sql, List.copyOf(bindings.values())));
                                }
                                return invoke(m, statement, a);
                            });
                });
    }

    private static Object invoke(Method method, Object target, Object[] args) throws Exception {
        try { return method.invoke(target, args); }
        catch (InvocationTargetException exception) {
            if (exception.getCause() instanceof Exception cause) throw cause;
            throw exception;
        }
    }
}
