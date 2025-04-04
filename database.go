package main

type ClientProfile struct {
	Email string
	ID    string
	Name  string
	Token string
}

var database = map[string]ClientProfile{}
