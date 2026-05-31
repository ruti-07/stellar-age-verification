#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    CommitmentNotFound = 4,
    AlreadyVerified = 5,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Commitment(BytesN<32>),
    VerifiedUser(Address),
}

#[contract]
pub struct ZkAgeVerificationContract;

#[contractimpl]
impl ZkAgeVerificationContract {
    /// Initializes the contract with an admin address.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Admin adds a valid (hashed) ID commitment to the registry.
    pub fn add_commitment(env: Env, admin: Address, commitment: BytesN<32>) -> Result<(), Error> {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if admin != stored_admin {
            return Err(Error::NotAuthorized);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Commitment(commitment.clone()), &true);
        env.events().publish((symbol_short!("add_com"), admin), commitment);
        Ok(())
    }

    /// User submits a hash (commitment) to verify their age.
    pub fn verify_age(env: Env, user: Address, commitment: BytesN<32>) -> Result<(), Error> {
        user.require_auth();

        let is_verified = env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::VerifiedUser(user.clone()))
            .unwrap_or(false);
        if is_verified {
            return Err(Error::AlreadyVerified);
        }

        let is_valid_commitment = env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Commitment(commitment.clone()))
            .unwrap_or(false);
        if !is_valid_commitment {
            return Err(Error::CommitmentNotFound);
        }

        // Remove commitment to prevent reuse by another address
        env.storage()
            .persistent()
            .remove(&DataKey::Commitment(commitment.clone()));

        // Mark user as verified
        env.storage()
            .persistent()
            .set(&DataKey::VerifiedUser(user.clone()), &true);
        env.events()
            .publish((symbol_short!("verified"), user), commitment);
        Ok(())
    }

    /// Checks if a user is verified.
    pub fn is_verified(env: Env, user: Address) -> bool {
        env.storage()
            .persistent()
            .get::<_, bool>(&DataKey::VerifiedUser(user))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_initialize_and_add_commitment() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkAgeVerificationContract);
        let client = ZkAgeVerificationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let commitment = BytesN::from_array(&env, &[1; 32]);
        env.mock_all_auths();
        client.add_commitment(&admin, &commitment);
    }

    #[test]
    fn test_verify_age() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ZkAgeVerificationContract);
        let client = ZkAgeVerificationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let commitment = BytesN::from_array(&env, &[1; 32]);
        env.mock_all_auths();
        client.add_commitment(&admin, &commitment);

        let user = Address::generate(&env);
        client.verify_age(&user, &commitment);

        assert_eq!(client.is_verified(&user), true);
    }
}
