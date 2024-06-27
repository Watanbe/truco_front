import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../contexts/UserContext"
import SocketContext from "../contexts/SocketContext"
import Icon from "@mui/material/Icon"
import { RoomMessage } from "../types/types"

export default function Home() {
	const { user, setUser } = useContext(UserContext)
	const socket = useContext(SocketContext)
	const [username, setUsername] = useState("")
	const navigate = useNavigate()
	const [firstConnect, setFirstConnect] = useState(false)
	const [status, setStatus] = useState("")
	const [room, setRoom] = useState("")
	const [roomStatus, setRoomStatus] = useState("")

	const handleCreateRoom = (event: React.FormEvent) => {
		event.preventDefault()

		if (!checkName(username)) return

		if (socket.connected) {
			createGame()
		} else {
			socket.connect()

			socket.on("connect", () => {
				console.log("socket connected", socket)
				if (!firstConnect) setFirstConnect(true) // set first connect to true so that the user is redirected to wait room upon first connection
			})
		}
	}

	const handleConnect = (event: React.FormEvent) => {
		event.preventDefault()

		if (!checkName(username)) return

		setStatus("connect_room")
	}

	const handleConnectRoom = (event: React.FormEvent) => {
		event.preventDefault()

		if (!checkRoom(room)) return

		if (socket.connected) {
			connectGame(room)
		} else {
			socket.connect()

			socket.on("connect", () => {
				console.log("socket connected", socket)
				if (!firstConnect) setFirstConnect(true) // set first connect to true so that the user is redirected to wait room upon first connection
			})
		}
	}

	const handleBackButton = (event: React.FormEvent) => {
		event.preventDefault()

		setStatus("")
		setRoom("")
	}

	const checkName = (name: string) => {
		if (!name || name.trim().length === 0) {
			setStatus("invalid_username")
			return false
		}
		return true
	}

	const checkRoom = (name: string) => {
		if (!name || name.trim().length === 0) {
			setRoomStatus("invalid_room")
			return false
		}
		return true
	}

	const createGame = () => {
		if (status) setStatus("")
		socket.emit("create_game", { username })
	}

	const connectGame = (room: string) => {
		setUser({
			id: socket.id,
			username,
			room,
		})
		socket.emit("connect_game", { username, room, team: 3 })
	}

	useEffect(() => {
		console.log("useEffect called")

		socket.on("disconnect", () => {
			console.log("Disconnected")
		})

		socket.on("connect_error", (error: Error) => {
			console.log("connect_error", error)
			setStatus("connect_error")
		})

		// Cleanup function to remove the event listeners when the component unmounts
		return () => {
			socket.off("connect")
			socket.off("connect_error")
		}
	}, [])

	useEffect(() => {
		// this will be called every time the firstConnect state changes
		if (firstConnect) {
			if (room) connectGame(room)
			else createGame()
		}
	}, [firstConnect])

	useEffect(() => {
		socket.on("connect_successfully", (data: any) => {
			console.log("connect_successfully", data)
			if (status) setStatus("")
			const isLeader = !room
			if (isLeader) {
				setRoom(data.room)
				setUsername(data.username)
				setUser({
					id: socket.id,
					username: data.username,
					room: data.room,
				})
			}

			const dataPlayers = data["players"]

			const team1 = dataPlayers.at(0).map((player: string) => ({ name: player, team: "1" }))
			while (team1.length < 2) {
				team1.push({ name: "", team: "1" })
			}

			const team2 = dataPlayers.at(1).map((player: string) => ({ name: player, team: "2" }))
			while (team2.length < 2) {
				team2.push({ name: "", team: "2" })
			}

			navigate("/waitRoom", {
				state: {
					props: {
						players: [...team1, ...team2],
						room: data.room,
						isLeader,
					},
				},
			})
		})

		socket.on("room_message", (roomMessage: RoomMessage) => {
			console.log("room_message", roomMessage)
			switch (roomMessage.status) {
				case 3: {
					setRoomStatus("room_not_found")
					break
				}
				case 2: {
					setRoomStatus("room_full")
					break
				}
				case 0: {
					// success
					break
				}
			}
		})

		// Cleanup function to remove the event listener when the component unmounts
		return () => {
			socket.off("connect_successfully")
			socket.off("room_message")
		}
	}, [username, user]) // Add socket and username as dependencies

	return (
		<>
			<div
				className="grid min-h-screen content-center bg-cover bg-center gap-5 md:grid-cols-2 md:content-normal "
				style={{background: "linear-gradient(-45deg, rgba(0, 0, 0, 0.9), rgba(26, 192, 109, 0.73)), url('https://i.pinimg.com/originals/c1/25/42/c125428ccdb6c1e9976eb677f4358d93.jpg')",
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					backgroundAttachment: "fixed",
				}}>
				<div className="flex h-full w-full flex-col items-center gap-3 p-4 text-white/90 md:justify-center ">
					<img src="/logo.png" alt="Cartas" className="-my-8 h-150 w-150 " />
				</div>
				{status === "connect_room" ? (
					<form className="center flex max-w-fit flex-col gap-3 self-center justify-self-center px-4">
						{(() => {
							switch (roomStatus) {
								case "invalid_room":
									return (
										<div className="flex justify-center gap-2 rounded-md bg-red-300 p-3 text-gray-50">
											<Icon className="me-auto">error</Icon>
											<div className="me-auto">Sala inválida</div>
										</div>
									)
								case "room_not_found":
									return (
										<div className="flex justify-center gap-2 rounded-md bg-red-300 p-3 text-gray-50">
											<Icon className="me-auto">error</Icon>
											<div className="me-auto">Sala Inexistente</div>
										</div>
									)
								case "room_full":
									return (
										<div className="flex justify-center gap-2 rounded-md bg-red-300 p-3 text-gray-50">
											<Icon className="me-auto">error</Icon>
											<div className="me-auto">Sala Cheia</div>
										</div>
									)
								case "connect_error":
									return (
										<div className="flex justify-center gap-2 rounded-md bg-red-300 p-3 text-gray-50">
											<Icon className="me-auto">error</Icon>
											<div className="me-auto">Houve um problema ao se conectar com o servidor</div>
										</div>
									)
								default:
									return null
							}
						})()}
						<label htmlFor="room" className="sr-only">
							Código da sala:
						</label>
						<input
							id="room"
							name="room"
							type="text"
							autoComplete="username"
							required
							className="placeholder:text-gray-2000 min-w-0 rounded-md border border-gray-300 px-3.5 py-2 shadow-sm ring-1 ring-inset ring-white/50 sm:text-sm sm:leading-6"
							placeholder="Código da sala"
							value={room}
							onChange={(e) => setRoom(e.target.value)}
						/>
						<button
							className="rounded-md bg-green-500 px-8 py-2.5 text-sm font-semibold text-gray-100 shadow-sm hover:bg-green-600 focus:outline focus:outline-green-300"
							onClick={handleConnectRoom}
						>
							Conectar
						</button>
						<button
							type="submit"
							className="rounded-md bg-red-500 px-8 py-2.5 text-sm font-semibold text-gray-100 shadow-sm hover:bg-red-600 focus:outline focus:outline-red-300"
							onClick={handleBackButton}
						>
							Voltar
						</button>
					</form>
				) : (
					<div className="uk-section uk-flex uk-flex-middle uk-animation-fade">
						<div className="uk-width-1-1">
							<div className="uk-container">
								<div className="uk-grid-margin uk-grid uk-grid-stack uk-login-body">
									<div className="uk-width-1-1@m">
										<div className="uk-margin uk-width-large uk-margin-auto uk-card uk-card-default uk-card-body uk-box-shadow-large box-color">
											<h3 className="uk-card-title draken-title-form-f uk-text-center textcolor">Iniciar Partida</h3>
											<form onSubmit={handleConnectRoom}>
												{(() => {
													switch (status) {
														case "invalid_username":
															return (
																<div className="flex justify-center gap-2 rounded-md bg-red-300 p-3 text-gray-50">
																	<Icon className="me-auto">error</Icon>
																	<div className="me-auto">Nome inválido</div>
																</div>
															);
														case "connect_error":
															return (
																<div className="flex justify-center gap-2 rounded-md bg-red-300 p-3 text-gray-50">
																	<Icon className="me-auto">error</Icon>
																	<div className="me-auto">Houve um problema ao se conectar com o servidor</div>
																</div>
															);
														default:
															return null;
													}
												})()}
												<div className="flex flex-col">
													<label htmlFor="name" className="textcolor">
														Nome:
													</label>
													<input
														id="name"
														name="name"
														type="text"
														autoComplete="username"
														required
														className="placeholder:text-gray-2000 rounded-md border border-gray-300 px-3.5 py-2 shadow-sm ring-1 ring-inset ring-white/50 sm:text-sm sm:leading-6"
														value={username}
														onChange={(e) => setUsername(e.target.value)}
													/>
												</div>
												<div className="flex flex-col">
													<div className="uk-inline uk-width-1-1">
														<label htmlFor="type" className="textcolor">Tipo de Truco</label>
														<select className="uk-select" id="type">
															<option value="http://localhost:22002">Paulistinha</option>
															<option value="http://localhost:22001">Mineririnho</option>
														</select>
													</div>
												</div>
												<div className="flex flex-col">
													<div className="iten-buttons">
														<button 
															id="value_5"
															type="button"
															className="uk-button uk-button-primary selected_button rounded-md bg-green-500 value_button"
															style={{ display: "flex", alignItems: "center" }}
														>
															Apostas de R$ 5,00<img src="../../public/321321.webp" style={{ marginLeft: "5px" }} />
														</button>
														<button
															id="value_10"
															type="button"
															className="uk-button uk-button-primary rounded-md bg-green-500 flex items-center value_button"
															style={{ display: "flex", alignItems: "center" }}
														>
															Apostas de R$ 10,00
															<img src="../../public/321321.webp" style={{ marginLeft: "5px" }} />
														</button>

														<button 
															id="value_25"
															type="button"
															className="uk-button uk-button-primary rounded-md bg-green-500 flex items-center value_button"
															style={{ display: "flex", alignItems: "center" }}
														>
															Apostas de R$ 25,00<img src="../../public/321321.webp" style={{ marginLeft: "5px" }} />
														</button>
														<button 
															id="value_50"
															type="button"
															className="uk-button uk-button-primary rounded-md bg-green-500 flex items-center value_button"
															style={{ display: "flex", alignItems: "center" }}
														>
															Apostas de R$ 50,00<img src="../../public/321321.webp" style={{ marginLeft: "5px" }} />
														</button>
													</div>
												</div>
												<button
													className="rounded-md bg-green-500 px-8 py-2.5 text-sm font-semibold text-gray-100 shadow-sm hover:bg-green-600 focus:outline focus:outline-green-300"
													onClick={handleCreateRoom}
													style={{ width: "100%" }}
												>
													Criar Sala
												</button>
												<button
													type="submit"
													className="rounded-md bg-transparent px-8 py-2.5 text-sm font-semibold text-gray-100 shadow-sm ring-2 ring-green-500 hover:bg-green-500 focus:outline focus:outline-green-300"
													onClick={handleConnect}
													style={{ width: "100%", marginTop: "10px" }}
												>
													Conectar
												</button>
											</form>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	)
}
