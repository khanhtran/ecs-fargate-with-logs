package com.baeldung.docker.spring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        exception();
        SpringApplication.run(DemoApplication.class, args);
    }

    private static void exception() {
        try {
            float a = 5/0;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
