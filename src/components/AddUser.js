import React, { useState } from react;
		import axios from axios;
		const AddUser = () => {
		const [name, setName] = useState();
		const handleSubmit = async (e) => {
		e.preventDefault();
		await axios.post(http://localhost:3001/users, { name });
		setName();
		};
		return (
		<form onSubmit={handleSubmit}>
			<div>
				<label>Name</label>
				<input type="text" value={name} onChange={(e)=> setName(e.target.value)} />
            </div>
			<button type="submit">Add User</button>
		</form>
		);
		};
		export default AddUser;

		p><strong>
			Create a db.json File:
		</strong></p>